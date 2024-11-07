from fuzzywuzzy import fuzz
from fuzzywuzzy import process

# List of correct names
correct_names = ["Bhubaneswar", "Mumbai", "Kolkata", "Delhi", "Chennai"]

# Input name with potential typo
input_name = "lourbhanear"

# Find the best match
best_match = process.extractOne(input_name, correct_names)

print(f"Input Name: {input_name}")
print(f"Best Match: {best_match[0]} with a confidence score of {best_match[1]}")
