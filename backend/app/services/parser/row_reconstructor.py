from typing import List, Dict, Any, Tuple
from loguru import logger
from utils import sanitize_text

def reconstruct_rows(
    words: List[Dict[str, Any]],
    column_boundaries: List[Tuple[str, float, float]],
    table_start_y: float,
    table_end_y: float,
    y_tolerance: float = 3.0
) -> List[Dict[str, str]]:
    """
    Groups words lying between table_start_y and table_end_y into structured rows.
    Returns a list of dicts, where each dict has keys corresponding to column names:
      'date', 'narration', 'reference_number', 'value_date', 'debit', 'credit', 'closing_balance'
    """
    # 1. Filter words within vertical table limits
    table_words = [
        w for w in words
        if table_start_y <= w["top"] < table_end_y - 1.0
    ]
    
    if not table_words:
        return []
        
    # 2. Group words into horizontal lines
    # Sort primarily by vertical coordinate (top) and secondarily by horizontal coordinate (x0)
    sorted_words = sorted(table_words, key=lambda w: (w["top"], w["x0"]))
    
    lines: List[List[Dict[str, Any]]] = []
    current_line: List[Dict[str, Any]] = []
    current_top = sorted_words[0]["top"]
    
    for w in sorted_words:
        if abs(w["top"] - current_top) <= y_tolerance:
            current_line.append(w)
        else:
            lines.append(sorted(current_line, key=lambda x: x["x0"]))
            current_line = [w]
            current_top = w["top"]
            
    if current_line:
        lines.append(sorted(current_line, key=lambda x: x["x0"]))
        
    # 3. Map each word in each line to the correct column boundary
    reconstructed_rows = []
    column_keys = [b[0] for b in column_boundaries]
    
    for idx, line in enumerate(lines):
        row_cells: Dict[str, List[str]] = {key: [] for key in column_keys}
        
        for w in line:
            center_x = (w["x0"] + w["x1"]) / 2.0
            
            # Find which column boundary this word falls into
            matched_col = None
            min_dist = float("inf")
            closest_col = None
            
            for col_key, start_x, end_x in column_boundaries:
                # Add a tiny overlap margin
                if start_x - 1.0 <= center_x <= end_x + 1.0:
                    matched_col = col_key
                    break
                    
                # Track closest column in case it falls outside all boundaries
                dist = min(abs(center_x - start_x), abs(center_x - end_x))
                if dist < min_dist:
                    min_dist = dist
                    closest_col = col_key
                    
            if not matched_col:
                matched_col = closest_col
                
            row_cells[matched_col].append(w["text"])
            
        # Convert lists of words to space-separated strings
        row_str: Dict[str, str] = {}
        for col_key in column_keys:
            joined = " ".join(row_cells[col_key])
            row_str[col_key] = sanitize_text(joined)
            
        # We only keep rows that have some text content
        if any(row_str.values()):
            reconstructed_rows.append(row_str)
            
    logger.info(f"Reconstructed {len(reconstructed_rows)} lines of text within table area.")
    return reconstructed_rows
