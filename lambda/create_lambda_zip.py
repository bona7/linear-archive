#!/usr/bin/env python3
"""
Script to create Lambda deployment packages.
This handles Linux .so files that PowerShell Compress-Archive cannot process.
"""
import os
import zipfile
from pathlib import Path

def create_lambda_zip(lambda_dir, package_dir, output_zip):
    """
    Create a Lambda deployment ZIP file.
    
    Args:
        lambda_dir: Directory containing lambda_function.py
        package_dir: Directory containing installed dependencies
        output_zip: Output ZIP file path
    """
    lambda_path = Path(lambda_dir)
    package_path = Path(package_dir)
    zip_path = Path(output_zip)
    
    # Remove old zip if exists
    if zip_path.exists():
        zip_path.unlink()
        print(f"Removed old {zip_path}")
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add all files from package directory (dependencies)
        if package_path.exists():
            print(f"Adding dependencies from {package_path}...")
            for root, dirs, files in os.walk(package_path):
                for file in files:
                    file_path = Path(root) / file
                    # Calculate relative path from package directory
                    arcname = file_path.relative_to(package_path)
                    zipf.write(file_path, arcname)
                    print(f"  Added: {arcname}")
        
        # Add lambda_function.py at root level
        lambda_function = lambda_path / 'lambda_function.py'
        if lambda_function.exists():
            zipf.write(lambda_function, 'lambda_function.py')
            print(f"Added: lambda_function.py")
        else:
            print(f"WARNING: {lambda_function} not found!")
    
    print(f"\n✓ Created {zip_path} ({zip_path.stat().st_size / 1024 / 1024:.2f} MB)")

if __name__ == '__main__':
    # Get the script directory (lambda folder)
    script_dir = Path(__file__).parent
    
    # Create data-compression Lambda ZIP
    print("=" * 60)
    print("Creating data-compression Lambda package...")
    print("=" * 60)
    create_lambda_zip(
        lambda_dir=script_dir / 'data-compression',
        package_dir=script_dir / 'data-compression' / 'package_build',
        output_zip=script_dir / 'data-compression' / 'data-compression.zip'
    )
    
    print("\n" + "=" * 60)
    print("Creating deepseek-analysis Lambda package...")
    print("=" * 60)
    create_lambda_zip(
        lambda_dir=script_dir / 'deepseek-analysis',
        package_dir=script_dir / 'deepseek-analysis' / 'package',
        output_zip=script_dir / 'deepseek-analysis' / 'deepseek-analysis.zip'
    )
    
    print("\n" + "=" * 60)
    print("✓ All Lambda packages created successfully!")
    print("=" * 60)
