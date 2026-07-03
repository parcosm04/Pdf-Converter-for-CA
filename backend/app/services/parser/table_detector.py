import re
from typing import List, Dict, Any, Tuple, Optional
from config import config
from loguru import logger
from rapidfuzz import fuzz

class TableDetector:
    def __init__(self):
        self.column_boundaries: List[Tuple[str, float, float]] = []
        self.header_y: Optional[float] = None
        self.footer_y: Optional[float] = None
        self.table_ended: bool = False

    def group_words_into_lines(self, words: List[Dict[str, Any]], y_tolerance: float = 3.0) -> List[List[Dict[str, Any]]]:
        """
        Groups words that lie within y_tolerance of each other into lines.
        Each line's words are sorted left-to-right (by x0).
        """
        if not words:
            return []
            
        # Sort words by top coordinate first
        sorted_words = sorted(words, key=lambda w: (w["top"], w["x0"]))
        
        lines: List[List[Dict[str, Any]]] = []
        current_line: List[Dict[str, Any]] = []
        last_top = sorted_words[0]["top"]
        
        for w in sorted_words:
            if abs(w["top"] - last_top) <= y_tolerance:
                current_line.append(w)
                last_top = w["top"]
            else:
                lines.append(sorted(current_line, key=lambda x: x["x0"]))
                current_line = [w]
                last_top = w["top"]
                
        if current_line:
            lines.append(sorted(current_line, key=lambda x: x["x0"]))
            
        return lines

    def _group_line_into_phrases(self, line_words: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Combines adjacent words in a line into phrases if they are very close horizontally.
        """
        if not line_words:
            return []
            
        phrases = []
        curr_phrase = line_words[0].copy()
        
        for w in line_words[1:]:
            # If horizontal distance is small, merge
            if w["x0"] - curr_phrase["x1"] <= 8.0:
                curr_phrase["text"] += " " + w["text"]
                curr_phrase["x1"] = w["x1"]
                curr_phrase["bottom"] = max(curr_phrase["bottom"], w["bottom"])
            else:
                phrases.append(curr_phrase)
                curr_phrase = w.copy()
                
        phrases.append(curr_phrase)
        return phrases

    def _match_column(self, text: str) -> Optional[str]:
        """
        Matches a phrase text to a column key based on configuration.
        """
        text_lower = text.lower().strip()
        
        # Gather all patterns and sort by length descending to match more specific phrases first
        all_patterns = []
        for col_key, patterns in config.COLUMN_MAPPINGS.items():
            for pat in patterns:
                all_patterns.append((pat, col_key))
        all_patterns.sort(key=lambda x: len(x[0]), reverse=True)
        
        # 1. Try exact matches first
        for pat, col_key in all_patterns:
            if pat == text_lower:
                return col_key
                
        # 2. Try substring matches (pattern must be contained in the header text)
        for pat, col_key in all_patterns:
            if pat in text_lower:
                return col_key
                
        # 3. Try partial fuzzy matches (only if lengths are reasonably close)
        for pat, col_key in all_patterns:
            if fuzz.partial_ratio(pat, text_lower) >= 85:
                if len(text_lower) >= len(pat) * 0.7:
                    return col_key
                
        return None

    def detect_table_layout(
        self,
        words: List[Dict[str, Any]],
        page_width: float,
        page_height: float
    ) -> Tuple[List[Tuple[str, float, float]], float, float]:
        """
        Scans page words to identify the transaction table header and boundaries.
        Returns:
          column_boundaries: List of (col_key, x0, x1)
          table_start_y: Y coordinate below header
          table_end_y: Y coordinate above footer/totals
        """
        if self.table_ended:
            logger.info("Table has already ended on a previous page. Skipping table detection.")
            return [], 0.0, 0.0
            
        # Group words using a larger Y-tolerance of 8.0 to group multi-line headers together
        lines = self.group_words_into_lines(words, y_tolerance=8.0)
        
        header_line_idx = -1
        detected_mappings: List[Tuple[str, float, float]] = []
        table_start_y_custom = None
        
        # Helper to extract matches from a line
        def get_line_matches(line):
            phrases = self._group_line_into_phrases(line)
            matches = []
            for p in phrases:
                col_key = self._match_column(p["text"])
                if col_key:
                    matches.append((col_key, p["x0"], p["x1"]))
            return matches

        # 1. Search for the header line - First try single lines
        for idx, line in enumerate(lines):
            matches = get_line_matches(line)
            unique_keys = {m[0] for m in matches}
            if len(unique_keys) >= 3 and "date" in unique_keys and ("closing_balance" in unique_keys or "debit" in unique_keys or "credit" in unique_keys or "amount" in unique_keys):
                header_line_idx = idx
                detected_mappings = matches
                logger.info(f"Header row detected on page at Y={line[0]['top']:.2f} text: {[w['text'] for w in line]}")
                break
                
        # 1b. Split header detection - if not found, try combining adjacent lines
        if header_line_idx == -1:
            for idx in range(len(lines) - 1):
                line1 = lines[idx]
                line2 = lines[idx+1]
                
                # Check that they are physically close (e.g. within 25 points)
                y_gap = line2[0]["top"] - max(w["bottom"] for w in line1)
                if y_gap > 25.0:
                    continue
                    
                matches1 = get_line_matches(line1)
                matches2 = get_line_matches(line2)
                
                combined_matches = matches1 + matches2
                unique_keys = {m[0] for m in combined_matches}
                
                if len(unique_keys) >= 3 and "date" in unique_keys and ("closing_balance" in unique_keys or "debit" in unique_keys or "credit" in unique_keys or "amount" in unique_keys):
                    header_line_idx = idx
                    # Merge column matches, keeping the widest boundary for duplicates
                    key_to_coords = {}
                    for col_key, x0, x1 in combined_matches:
                        if col_key not in key_to_coords:
                            key_to_coords[col_key] = (x0, x1)
                        else:
                            prev_x0, prev_x1 = key_to_coords[col_key]
                            key_to_coords[col_key] = (min(prev_x0, x0), max(prev_x1, x1))
                    
                    detected_mappings = [(k, coords[0], coords[1]) for k, coords in key_to_coords.items()]
                    table_start_y_custom = max(w["bottom"] for w in line2)
                    logger.info(f"Split header row detected spanning Y={line1[0]['top']:.2f} and Y={line2[0]['top']:.2f}")
                    break
                    
        # 2. Determine column boundaries if header is found
        if header_line_idx != -1:
            if table_start_y_custom is not None:
                table_start_y = table_start_y_custom
            else:
                header_line = lines[header_line_idx]
                table_start_y = max(w["bottom"] for w in header_line)
            
            # Sort detected columns by their X center coordinates
            detected_mappings = sorted(detected_mappings, key=lambda m: (m[1] + m[2]) / 2.0)
            
            # Calculate centers
            centers = []
            for col_key, x0, x1 in detected_mappings:
                centers.append((col_key, (x0 + x1) / 2.0))
                
            # Build text density map along the X-axis for words within the table body
            density = [0] * int(page_width + 10)
            for w in words:
                # Only analyze words physically below the header row
                if table_start_y + 4.0 <= w["top"] <= page_height:
                    x0_idx = max(0, int(w["x0"]))
                    x1_idx = min(len(density) - 1, int(w["x1"]))
                    for x in range(x0_idx, x1_idx + 1):
                        density[x] += 1
                        
            # Construct boundaries by finding the minimum density point (gutters) between column centers
            boundaries = []
            for i, (col_key, center) in enumerate(centers):
                if i == 0:
                    start_x = 0.0
                else:
                    prev_center = centers[i-1][1]
                    search_start = int(prev_center)
                    search_end = int(center)
                    
                    # Find coordinates that minimize word text density (white space gutters)
                    min_val = float("inf")
                    min_xs = []
                    for x in range(search_start, search_end + 1):
                        if x < len(density):
                            val = density[x]
                            if val < min_val:
                                min_val = val
                                min_xs = [x]
                            elif val == min_val:
                                min_xs.append(x)
                                
                    # Split exactly at the center of the gutter
                    start_x = sum(min_xs) / len(min_xs)
                    
                # Update the previous column's end boundary
                if i > 0:
                    boundaries[-1] = (boundaries[-1][0], boundaries[-1][1], start_x)
                    
                boundaries.append((col_key, start_x, page_width))
                
            self.column_boundaries = boundaries
            self.header_y = table_start_y
        else:
            # If no header is found, fall back to previous page's headers or default coordinates
            if self.column_boundaries:
                logger.info("No header row detected. Reusing boundaries from previous page.")
                
                # Adaptive header Y detection on subsequent pages:
                # Find the lowest page header keyword (e.g. branch, page, gst, address details)
                header_keywords = ["branch", "address", "page", "gst", "office", "registered", "holder", "account", "statement", "ifsc", "micr"]
                max_header_y = 0.0
                for w in words:
                    if w["top"] < page_height * 0.3:  # Only look at the top 30% of the page
                        text_lower = w["text"].lower()
                        if any(k in text_lower for k in header_keywords):
                            max_header_y = max(max_header_y, w["bottom"])
                            
                # If we found header keywords, start the table below them (with margin of 5.0)
                # Else fall back to a safe default of 185.0
                table_start_y = max_header_y + 5.0 if max_header_y > 0 else 185.0
                logger.info(f"Adaptive table start Y set to: {table_start_y:.2f} (detected header Y: {max_header_y:.2f})")
            else:
                logger.warning("No header row detected, and no previous boundaries. Defaulting to standard intervals.")
                # Standard default boundaries (ratios of page width)
                # Date, Narration, Ref, Val Date, Debit, Credit, Balance
                w = page_width
                self.column_boundaries = [
                    ("date", 0.0, w * 0.12),
                    ("narration", w * 0.12, w * 0.45),
                    ("reference_number", w * 0.45, w * 0.58),
                    ("value_date", w * 0.58, w * 0.68),
                    ("debit", w * 0.68, w * 0.78),
                    ("credit", w * 0.78, w * 0.88),
                    ("closing_balance", w * 0.88, w)
                ]
                
                # Fallback: scan lines to find the first transaction row to avoid header noise
                import re
                date_regex = re.compile(config.NEW_TRANSACTION_REGEX)
                first_txn_y = None
                
                row_lines = self.group_words_into_lines(words, y_tolerance=3.0)
                for rline in row_lines:
                    left_words = [word for word in rline if word["x0"] < page_width * 0.25]
                    left_words_sorted = sorted(left_words, key=lambda word: word["x0"])
                    if left_words_sorted:
                        word_texts = [word["text"] for word in left_words_sorted[:3]]
                        found = False
                        for start_idx in range(len(word_texts)):
                            candidate = " ".join(word_texts[start_idx:])
                            parts = candidate.split()
                            if len(parts) > 1 and parts[0].isdigit() and len(parts[0]) <= 4:
                                remainder = " ".join(parts[1:])
                                if date_regex.match(remainder):
                                    found = True
                                    break
                            if date_regex.match(candidate):
                                found = True
                                break
                        if found:
                            first_txn_y = min(word["top"] for word in left_words_sorted)
                            logger.info(f"Fallback scan: First transaction row date detected at Y={first_txn_y:.2f}")
                            break
                            
                table_start_y = first_txn_y - 2.0 if first_txn_y is not None else page_height * 0.15
                
        # 3. Detect footer / end of table
        table_end_y = page_height
        for line in lines:
            if line[0]["top"] <= table_start_y:
                continue
            
            line_text = " ".join(w["text"] for w in line).lower()
            
            # Table end markers (e.g. summary and grand totals block) - can appear anywhere on the page
            table_end_keywords = ["statement summary", "summary", "grand total", "other account details", "linked casa", "linked deposits", "linked loan", "total debits", "total credits", "total debit", "total credit", "closing balance"]
            if any(term in line_text for term in table_end_keywords):
                table_end_y = line[0]["top"]
                self.table_ended = True
                logger.info(f"Table end marker detected at Y={table_end_y:.2f} text: '{line_text}'")
                break
                
            # Layout footers (e.g. page numbers and carry forwards) - must be at bottom
            footer_keywords = ["page", "carried forward", "brought forward", "total", "note:"]
            if any(term in line_text for term in footer_keywords):
                if line[0]["top"] > page_height * 0.75:
                    table_end_y = line[0]["top"]
                    logger.info(f"Table footer detected at Y={table_end_y:.2f} text: '{line_text}'")
                    break
                    
        self.footer_y = table_end_y
        return self.column_boundaries, table_start_y, table_end_y
