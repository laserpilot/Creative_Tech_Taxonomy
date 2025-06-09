#!/usr/bin/env python3
"""
Script to analyze taxonomy nodes and identify those with minimal information.
This helps prioritize which nodes need more content without expensive API calls.
"""

import json
import sys
from pathlib import Path

def analyze_node(node, path=""):
    """Analyze a single node and return metrics about its content quality."""
    name = node.get("name", {})
    description = node.get("description", "")
    links = node.get("links", {})
    
    # Get English name for path tracking
    en_name = name.get("en", "Unknown") if isinstance(name, dict) else str(name)
    current_path = f"{path}/{en_name}" if path else en_name
    
    metrics = {
        "path": current_path,
        "name": en_name,
        "description_length": len(description.strip()) if description else 0,
        "has_meaningful_description": len(description.strip()) > 50 if description else False,
        "has_links": bool(links and any(v.strip() for v in links.values() if v)),
        "children_count": len(node.get("children", [])),
        "score": 0
    }
    
    # Calculate content quality score (0-100)
    score = 0
    
    # Description scoring (0-60 points)
    if metrics["description_length"] == 0:
        score += 0
    elif metrics["description_length"] < 20:
        score += 10
    elif metrics["description_length"] < 50:
        score += 25
    elif metrics["description_length"] < 100:
        score += 40
    else:
        score += 60
    
    # Links scoring (0-20 points)
    if metrics["has_links"]:
        score += 20
    
    # Children context scoring (0-20 points)
    if metrics["children_count"] > 0:
        score += 10
    if metrics["children_count"] > 3:
        score += 10
    
    metrics["score"] = score
    return metrics

def analyze_tree(node, path="", results=None):
    """Recursively analyze all nodes in the tree."""
    if results is None:
        results = []
    
    # Analyze current node
    metrics = analyze_node(node, path)
    results.append(metrics)
    
    # Recursively analyze children
    for child in node.get("children", []):
        analyze_tree(child, metrics["path"], results)
    
    return results

def load_taxonomy_data():
    """Load the main taxonomy data file."""
    data_file = Path("public/Creative_Tech_Taxonomy_data.json")
    if not data_file.exists():
        print(f"Error: {data_file} not found")
        sys.exit(1)
    
    with open(data_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def print_analysis_report(results):
    """Print a detailed analysis report."""
    # Sort by score (lowest first - these need the most help)
    results.sort(key=lambda x: x["score"])
    
    print("=== TAXONOMY NODE ANALYSIS REPORT ===\n")
    
    # Summary statistics
    total_nodes = len(results)
    low_quality = len([r for r in results if r["score"] < 30])
    medium_quality = len([r for r in results if 30 <= r["score"] < 60])
    high_quality = len([r for r in results if r["score"] >= 60])
    
    print(f"Total nodes analyzed: {total_nodes}")
    print(f"Low quality nodes (score < 30): {low_quality}")
    print(f"Medium quality nodes (30-59): {medium_quality}")
    print(f"High quality nodes (60+): {high_quality}")
    print()
    
    # Nodes needing immediate attention
    print("=== NODES NEEDING IMMEDIATE ATTENTION (Score < 30) ===")
    urgent_nodes = [r for r in results if r["score"] < 30]
    
    for i, node in enumerate(urgent_nodes[:20]):  # Show top 20
        print(f"{i+1:2d}. {node['name']} (Score: {node['score']})")
        print(f"    Path: {node['path']}")
        print(f"    Description length: {node['description_length']} chars")
        print(f"    Has links: {node['has_links']}")
        print(f"    Children: {node['children_count']}")
        print()
    
    if len(urgent_nodes) > 20:
        print(f"... and {len(urgent_nodes) - 20} more nodes with score < 30")
    
    print("\n=== NODES FOR IMPROVEMENT (Score 30-59) ===")
    medium_nodes = [r for r in results if 30 <= r["score"] < 60]
    
    for i, node in enumerate(medium_nodes[:10]):  # Show top 10
        print(f"{i+1:2d}. {node['name']} (Score: {node['score']})")
        print(f"    Path: {node['path']}")
        print()

def export_low_quality_nodes(results, threshold=30):
    """Export low quality nodes to a JSON file for processing."""
    low_quality = [r for r in results if r["score"] < threshold]
    
    export_data = {
        "analysis_date": "auto-generated",
        "threshold": threshold,
        "total_low_quality": len(low_quality),
        "nodes": low_quality
    }
    
    output_file = Path("low_quality_nodes.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)
    
    print(f"\nExported {len(low_quality)} low-quality nodes to {output_file}")

def main():
    """Main function to run the analysis."""
    print("Loading taxonomy data...")
    data = load_taxonomy_data()
    
    print("Analyzing nodes...")
    results = analyze_tree(data)
    
    print_analysis_report(results)
    export_low_quality_nodes(results)
    
    print("\n=== RECOMMENDATIONS ===")
    print("1. Focus on nodes with score < 30 first")
    print("2. Add meaningful descriptions (aim for 50+ characters)")
    print("3. Include relevant links when possible")
    print("4. Use the exported JSON file to batch process improvements")

if __name__ == "__main__":
    main()