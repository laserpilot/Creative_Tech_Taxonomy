#!/usr/bin/env python3
"""
Main enhancement script - convenient entry point for AI-assisted content enhancement.
"""

import sys
import subprocess
from pathlib import Path

def main():
    """Main enhancement workflow."""
    if len(sys.argv) < 2:
        print("Creative Tech Taxonomy AI Enhancement Tools")
        print("==========================================")
        print()
        print("Usage:")
        print("  python enhance.py analyze          # Analyze current state")
        print("  python enhance.py plan             # Generate processing plan") 
        print("  python enhance.py batch [N]        # Process N batches (default: 5)")
        print("  python enhance.py single <file>    # Process single batch file")
        print("  python enhance.py cleanup          # Clean up backup files")
        print()
        print("Examples:")
        print("  python enhance.py analyze")
        print("  python enhance.py batch 3")
        print("  python enhance.py single sample_batch_for_api.json")
        return
    
    command = sys.argv[1].lower()
    utilities_dir = Path("utilities")
    
    if command == "analyze":
        subprocess.run([sys.executable, utilities_dir / "analyze_nodes.py"])
        
    elif command == "plan":
        subprocess.run([sys.executable, utilities_dir / "efficient_enhance.py"])
        
    elif command == "batch":
        max_batches = int(sys.argv[2]) if len(sys.argv) > 2 else 5
        subprocess.run([sys.executable, utilities_dir / "batch_process.py", 
                       "--max-batches", str(max_batches)])
        
    elif command == "single":
        if len(sys.argv) < 3:
            print("Error: Please specify batch file")
            print("Usage: python enhance.py single <batch_file>")
            return
        batch_file = sys.argv[2]
        subprocess.run([sys.executable, utilities_dir / "apply_enhancements.py", batch_file])
        
    elif command == "cleanup":
        subprocess.run([sys.executable, utilities_dir / "auto_cleanup.py"])
        
    else:
        print(f"Unknown command: {command}")
        print("Run 'python enhance.py' for usage help")

if __name__ == "__main__":
    main()