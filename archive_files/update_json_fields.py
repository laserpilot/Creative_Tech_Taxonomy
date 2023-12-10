import json

# Specify the input and output file paths
input_file_path = (
    "../Creative_Tech_Taxonomy_data.json"  # Replace with your input file path
)
output_file_path = "Creative_Tech_Taxonomy_data_updated.json"  # Replace with your desired output file path. then you'll want to manually move this to the main repo after modifications

# Read the existing JSON data from the input file
with open(input_file_path, "r") as infile:
    data = json.load(infile)


# Function to recursively modify each entry in the JSON
def modify_entry(entry):
    # Create a new dictionary to store the modified entry
    # Create a new dictionary to store the modified entry
    modified_entry = {"name": {"en": entry["name"]}}

    # Preserve existing content for description if it exists, otherwise set default value
    modified_entry["description"] = entry.get("description", "")

    # Preserve existing content for tags if it exists, otherwise set default value
    modified_entry["tags"] = entry.get("tags", [])

    # Add your desired fields to the modified entry
    modified_entry["links"] = entry.get("links", {"Link": ""})

    # Check if the entry has a "children" field
    if "children" in entry and isinstance(entry["children"], list):
        # Recursively modify each child entry
        modified_entry["children"] = [
            modify_entry(child) for child in entry["children"]
        ]

    return modified_entry


# Modify each entry in the data
modified_data = modify_entry(data)

# Write the modified data to the output file
with open(output_file_path, "w") as outfile:
    json.dump(modified_data, outfile, indent=2)

print(f"Modification complete. Updated data written to {output_file_path}")
