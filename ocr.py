import sys
import json
import io
from PIL import Image, UnidentifiedImageError, ImageFilter, ImageEnhance
import pytesseract
import PyPDF2
import pdf2image
import os
import re
import spacy
import cv2
import numpy as np
import easyocr
from pymongo import MongoClient


client = MongoClient('mongodb://localhost:27017')
db = client['knowledge_base']
collection = db['states_and_districts']


poppler_path = r"C:\Users\SATYAJIT\Downloads\Release-24.07.0-0\poppler-24.07.0\Library\bin"
os.environ["PATH"] += os.pathsep + poppler_path


nlp = spacy.load("en_core_web_sm")
def extract_entities(text):
    doc = nlp(text)
    # Filter valid person names based on NER and pattern matching
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            # Validate the name format: two words, starting with uppercase letters
            if re.match(r"^[A-Z][a-z]+ [A-Z][a-z]+$", ent.text):
                return ent.text
    return None

def preprocess_image(image):
    # Convert to grayscale
    gray_image = image.convert('L')
    
    # Increase contrast
    enhancer = ImageEnhance.Contrast(gray_image)
    enhanced_image = enhancer.enhance(2)
    
    # Apply adaptive thresholding
    binary_image = enhanced_image.point(lambda x: 0 if x < 128 else 255, '1')
    
    # Apply additional filters for noise reduction
    filtered_image = binary_image.filter(ImageFilter.MedianFilter(size=3))
    
    return filtered_image



def extract_text_from_image(image_path):
    try:
        # Open the image
        image = Image.open(image_path)
        
        # Preprocess the image
        preprocessed_image = preprocess_image(image)
        
        # Convert the preprocessed image to a NumPy array (required by EasyOCR)
        preprocessed_image_np = np.array(preprocessed_image)

        # Initialize EasyOCR
        reader = easyocr.Reader(['en',])  # English language
        
        # Extract text using EasyOCR
        result = reader.readtext(preprocessed_image_np, detail=0)  # detail=0 for simplified output
        
        return ' '.join(result)  # Join the extracted text into a single string
    
    except UnidentifiedImageError:
        return "Error: Cannot identify image file."
    except Exception as e:
        return f"Error extracting text from image using EasyOCR: {str(e)}"


def extract_text_from_pdf(file_path):
    try:
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            num_pages = len(reader.pages)
            text = f"PDF contains {num_pages} page(s)\n\n"
            
            for page_num, page in enumerate(reader.pages, 1):
                text += f"--- Page {page_num} ---\n"
                
                page_text = page.extract_text()
                if page_text.strip():
                    text += page_text + "\n"
                else:
                    text += "No embedded text found. Attempting OCR...\n"
                    
                    images = pdf2image.convert_from_path(file_path,first_page=page_num,dpi=850, last_page=page_num)
                    if images:
                        preprocessed_image = preprocess_image(images[0])
                        custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:;()-&'
                        ocr_text = pytesseract.image_to_string(preprocessed_image, config=custom_config)
                        text += ocr_text + "\n"
                    else:
                        text += "Failed to convert page to image for OCR.\n"
                
                text += "\n"
            
            return text
    except PyPDF2.errors.PdfReadError:
        return "Error: Could not read the PDF file."
    except Exception as e:
        return f"Error extracting text from PDF: {str(e)}"  # Ensure this line ends with a closing quotation mark



        
def identify_document_type(text):
    document_types = {
        "Affidavit": r"affidavit|sworn before|first class magistrate",
        "AICTE Approval Letter": r"AICTE approval|All India Council for Technical Education",
        "Certificate of Minority Status": r"minority status|certificate of minority",
        "Appointment Letter": r"appointment letter|offer of appointment",
        "Joining Letter": r"joining letter|letter of joining",
        "Identity Card": r"identity card|id card|student card|bachelor of|master of|doctor of",
        "Educational Certificate": r"degree awarded|bachelor of|master of|doctor of",
        "Land Document": r"land document|plot no\.|registration no\.|area\s*:|land title|Schedule I Form No.39-A",
    }

    for doc_type, pattern in document_types.items():
        if re.search(pattern, text, re.IGNORECASE):
            return doc_type
    return "Unknown"

def extract_key_information(text, doc_type):
    info = {}

    if doc_type == "Affidavit":
        stamp_paper_value = re.search(r"stamp paper of Rs\.\s*(\d+)", text, re.IGNORECASE)
        sworn_before = re.search(r"sworn before\s*(.*?)\s*magistrate", text, re.IGNORECASE)
        name_pattern = r"(.*?)\s*,?\s*aged"
        name_match = re.search(name_pattern, text)
        age_pattern = r"aged\s*about\s*(\d+)"
        age_match = re.search(age_pattern, text, re.IGNORECASE)
        plot_number_pattern = r"(Revenue\s+)?Plot No\.?\s*([A-Za-z0-9\-/]+)"
        plot_number_match = re.search(plot_number_pattern, text, re.IGNORECASE)

        if stamp_paper_value:
            info["Stamp Paper Value"] = stamp_paper_value.group(1)
        if sworn_before:
            info["Sworn Before"] = sworn_before.group(1) + " Magistrate"
        if name_match:
            name = name_match.group(1).strip()
            name = re.sub(r"\b[Ii|}]+\b", "", name).strip()
            info["Name"] = name
        if age_match:
            info["Age"] = age_match.group(1)
        if plot_number_match:
            plot_number_prefix = plot_number_match.group(1)
            plot_number_value = plot_number_match.group(2)
            info["Plot Number"] = f"{plot_number_prefix or ''} Plot No. {plot_number_value}".strip()

    elif doc_type == "AICTE Approval Letter":
        approval_number = re.search(r"AICTE/(\w+/\d+)", text)
        institution_name = re.search(r"Institution Name:\s*(.+)", text)
        approval_date = re.search(r"Date of Approval:\s*(.+)", text)
        courses = re.search(r"Courses Approved:\s*(.+)", text)
        intake = re.search(r"Intake Capacity:\s*(\d+)", text)

        if approval_number:
            info["Approval Number"] = approval_number.group(1)
        if institution_name:
            info["Institution Name"] = institution_name.group(1)
        if approval_date:
            info["Approval Date"] = approval_date.group(1)
        if courses:
            info["Approved Courses"] = courses.group(1)
        if intake:
            info["Intake Capacity"] = intake.group(1)

    elif doc_type == "Identity Card":
        # Improved regex for Degree
        degree = re.search(r"(Bachelor|Master|Doctor) of\s*(.+)", text)
        
        # Use SpaCy NER to extract the name
        extracted_name = extract_entities(text)
        
        # Improved regex for ID number
        id_number = re.search(r"(\d{2}[A-Z]+\d+)", text)
        
        # Improved regex for Department
        department = re.search(r"(Computer Sci\. & Engg\..+)", text)
        
        # Improved regex for District, City, and PinCode
        district = re.search(r"Dist:?[\s\n]*([A-Za-z]+)", text)
        city = re.search(r"([A-Za-z]+)-\d{6}", text)
        pin_code = re.search(r"(\d{6})", text)
        
        # Populating extracted information
        if degree:
            info["Degree"] = degree.group(0)
        if extracted_name:
            info["Name"] = extracted_name
        else:
            info["Name"] = "Name not reliably detected"
        if id_number:
            info["IDNumber"] = id_number.group(1)
        if department:
            info["Department"] = department.group(1)
        if district:
            info["District"] = district.group(1)
        if city:
            info["City"] = city.group(1)
        if pin_code:
            info["PinCode"] = pin_code.group(1)
    
    
    state = None
    districts = []

    for state_doc in collection.find():
        if re.search(state_doc['state'], text, re.IGNORECASE):
            state = state_doc['state']
            for district in state_doc['districts']:
                if re.search(district, text, re.IGNORECASE):
                    districts.append(district)
            break

    if state:
        info["State"] = state
    if districts:
        info["Districts"] = districts

    return info

   

def verify_digital_signature(pdf_path):
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            if reader.is_encrypted:
                return "The PDF is encrypted. Cannot verify signature."
            
            if '/Sig' in reader.trailer['/Root']['/AcroForm']:
                return "Digital signature found. Further verification required."
            else:
                return "No digital signature found in the PDF."
    except Exception as e:
        return f"Error verifying digital signature: {str(e)}"
    
    

    
if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Invalid arguments. Usage: python extract_text.py <file_path> <file_type>"}))
        sys.exit(1)

    file_path = sys.argv[1]
    file_type = sys.argv[2].lower()

    try:
        if file_type == 'image':
            extracted_text = extract_text_from_image(file_path)
        elif file_type == 'pdf':
            extracted_text = extract_text_from_pdf(file_path)
        else:
            extracted_text = f"Unsupported file type: {file_type}"

        # Identify document type
        doc_type = identify_document_type(extracted_text)

        # Extract key information
        key_info = extract_key_information(extracted_text, doc_type)

        # Verify digital signature for PDFs
        digital_signature = verify_digital_signature(file_path) if file_type == 'pdf' else "Not applicable"

        # Encode the extracted text as UTF-8 and handle any encoding errors
        encoded_text = extracted_text.encode('utf-8', errors='ignore').decode('utf-8')

        # Output as JSON
        result = {
            "extractedText": encoded_text,
            "documentType": doc_type,
            "keyInformation": key_info,  # This should already be a dictionary
            "digitalSignature": digital_signature
        }
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({"error": f"Error during extraction and analysis: {str(e)}"}))
        
        
        

    sys.stdout.flush()