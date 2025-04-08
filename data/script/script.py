import zipfile
import xml.etree.ElementTree as ET
from math import radians, sin, cos, sqrt, atan2

# Haversine formula to calculate distance between two points
def haversine(lat1, lon1, lat2, lon2):
    # Radius of the Earth in km
    R = 6371.0

    # Convert latitude and longitude from degrees to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    # Return distance in kilometers
    return R * c

# Function to extract coordinates from KML
def extract_coordinates_from_kml(kml_file):
    tree = ET.parse(kml_file)
    root = tree.getroot()

    # KML Namespace
    ns = {'kml': 'http://www.opengis.net/kml/2.2'}

    # Extract coordinates of the line (assuming LineString)
    coordinates = []
    for elem in root.iterfind('.//kml:coordinates', ns):
        coords = elem.text.strip().split()
        for coord in coords:
            lon, lat, _ = map(float, coord.split(','))
            coordinates.append((lat, lon))
    return coordinates

# Function to calculate the total length of the line in kilometers
def calculate_line_length(kmz_file):
    # Unzip the KMZ file to get the KML
    with zipfile.ZipFile(kmz_file, 'r') as zip_ref:
        zip_ref.extractall("temp_kml")

    # Find the KML file in the extracted folder (assumes only one KML file in KMZ)
    kml_file = "temp_kml/doc.kml"  # Adjust if necessary

    # Extract coordinates from the KML file
    coordinates = extract_coordinates_from_kml(kml_file)

    # Calculate the length of the line by summing the distances between consecutive points
    total_distance = 0
    for i in range(1, len(coordinates)):
        lat1, lon1 = coordinates[i - 1]
        lat2, lon2 = coordinates[i]
        total_distance += haversine(lat1, lon1, lat2, lon2)

    return total_distance

# Example usage:
kmz_file = "243726 points.kmz"
total_length = calculate_line_length(kmz_file)
print(f"The total length of the line is {total_length:.2f} kilometers.")