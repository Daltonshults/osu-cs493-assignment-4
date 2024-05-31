#!/bin/bash

# Getting businesses
output=$(curl -s http://localhost:8000/businesses)

id=$(echo $output | python3 -c "import sys, json; print(json.load(sys.stdin)['businesses'][0]['_id'])")

echo "ID: $id"

echo -e "\n Submitting a png should pass\n"
photo=$(curl -X POST http://localhost:8000/photos \
    -F 'image=@TestingImages.png' \
    -F "metadata={\"caption\": \"this is a caption\", \"businessId\": \"$id\"}"
)
echo -e "\n$photo"
echo -e "After submitting png\n\n\n\n"

echo $photo
photo_id=$(echo $photo | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")

echo -e "\nPhoto ID: $photo_id\n"

# Getting photo information
echo -e "\nGetting photo information"
curl http://localhost:8000/photos/$photo_id

# Dowloading photo
echo -e "\nDownloading photo"
curl -o download_test_png.png http://localhost:8000/media/photos/$photo_id.png
echo -e "Photo Download Finished\n"

# Getting thumbnail
echo -e "\nGetting thumbnail"
curl -o download_test_thumbnail.jpg http://localhost:8000/media/thumbs/$photo_id.jpg
echo -e "Thumbnail Download Finished\n"


# Submitting a gif should fail
echo -e "\n Submitting a gif should fail\n"
curl -X POST http://localhost:8000/photos \
    -F 'image=@TestingImages.gif' \
    -F "metadata={\"caption\": \"this is a caption\", \"businessId\": \"$id\"}"
echo -e "After submitting photo\n"


# Submitting a jpg should pass
echo -e "\n Submitting a jpg should pass\n"
curl -X POST http://localhost:8000/photos \
    -F 'image=@TestingImages.jpg' \
    -F "metadata={\"caption\": \"this is a caption\", \"businessId\": \"$id\"}"
echo -e "After submitting photo\n"


# Getting the business photo information
echo -e "\nGET businesses/{id} should pass"
curl http://localhost:8000/businesses/$id
echo -e "After getting businesses/{id}\n"

echo -e "\nGET /photos/{id} should pass"
curl http://localhost:8000/photos/$photo_id
echo -e "After getting photos/{id}\n"