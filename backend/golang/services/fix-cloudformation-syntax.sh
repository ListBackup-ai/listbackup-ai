#!/bin/bash

# Fix CloudFormation intrinsic function syntax in serverless.yml files
# Convert from !GetAtt, !Ref, !Sub to proper Serverless Framework syntax

echo "Fixing CloudFormation syntax in serverless.yml files..."

# Find all serverless.yml files
find . -name "serverless.yml" -type f | grep -v node_modules | while read -r file; do
    echo "Processing: $file"
    
    # Create a backup
    cp "$file" "$file.bak"
    
    # Fix !GetAtt ResourceName.AttributeName -> {"Fn::GetAtt": ["ResourceName", "AttributeName"]}
    # This is complex, so we'll use perl for better regex support
    perl -i -pe 's/!GetAtt\s+(\w+)\.(\w+)/{"Fn::GetAtt": ["$1", "$2"]}/g' "$file"
    
    # Fix !Ref ResourceName -> {"Ref": "ResourceName"}
    perl -i -pe 's/!Ref\s+(\w+)/{"Ref": "$1"}/g' "$file"
    
    # Fix !Sub "string" -> {"Fn::Sub": "string"}
    perl -i -pe 's/!Sub\s+"([^"]+)"/{"Fn::Sub": "$1"}/g' "$file"
    perl -i -pe "s/!Sub\s+'([^']+)'/{\\"Fn::Sub\\": \\"$1\\"}/g" "$file"
    
    # Fix !Join ["delimiter", [list]] -> {"Fn::Join": ["delimiter", [list]]}
    perl -i -pe 's/!Join\s+(\[.*?\])/{"Fn::Join": $1}/g' "$file"
    
    # Check if file was modified
    if diff -q "$file" "$file.bak" >/dev/null; then
        echo "  No changes needed"
        rm "$file.bak"
    else
        echo "  Fixed CloudFormation syntax"
        rm "$file.bak"
    fi
done

echo "Done!"