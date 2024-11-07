from pymongo import MongoClient

# Replace 'your_connection_string' with your MongoDB connection string
client = MongoClient('mongodb://localhost:27017')
db = client['knowledge_base']
collection = db['states_and_districts']

# Sample data for states and districts
states_and_districts = [
    {
        "state": "Andhra Pradesh",
        "districts": ["Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool", "Nellore", "Prakasam", "Srikakulam", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"]
    },
    {
        "state": "Arunachal Pradesh",
        "districts": ["Tawang", "West Kameng", "East Kameng", "Papum Pare", "Kurung Kumey", "Kra Daadi", "Lower Subansiri", "Upper Subansiri", "West Siang", "East Siang", "Siang", "Upper Siang", "Lower Siang", "Lower Dibang Valley", "Dibang Valley", "Anjaw", "Lohit", "Namsai", "Changlang", "Tirap", "Longding"]
    }
    # Add more states and districts here
]

# Insert the data into the collection
collection.insert_many(states_and_districts)
