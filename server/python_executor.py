#!/usr/bin/env python3
"""
Simple Python code executor for ChrisAI
Executes Python code in a safe, sandboxed environment
"""

import sys
import io
import contextlib
import json
import traceback
import re
from typing import Dict, Any, List

def safe_eval(expression: str) -> Any:
    """Safely evaluate simple Python expressions"""
    allowed_names = {
        "__builtins__": {
            "abs", "all", "any", "bin", "bool", "chr", "dict", "divmod",
            "enumerate", "filter", "float", "hex", "int", "len", "list",
            "map", "max", "min", "oct", "ord", "pow", "range", "reversed",
            "round", "set", "sorted", "str", "sum", "tuple", "type", "zip"
        }
    }
    
    try:
        return eval(expression, {"__builtins__": allowed_names["__builtins__"]})
    except Exception as e:
        raise e

def execute_python_code(code: str) -> Dict[str, Any]:
    """
    Execute Python code and return the result
    Returns: {"success": bool, "output": str, "error": str}
    """
    
    # Capture stdout and stderr
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    
    captured_output = io.StringIO()
    captured_error = io.StringIO()
    
    result = {
        "success": True,
        "output": "",
        "error": ""
    }
    
    try:
        # Redirect output
        sys.stdout = captured_output
        sys.stderr = captured_error
        
        # Create a safe execution environment
        safe_globals = {
            "__builtins__": {
                "print": print,
                "len": len,
                "str": str,
                "int": int,
                "float": float,
                "bool": bool,
                "list": list,
                "dict": dict,
                "tuple": tuple,
                "set": set,
                "range": range,
                "sum": sum,
                "max": max,
                "min": min,
                "abs": abs,
                "round": round,
                "sorted": sorted,
                "reversed": reversed,
                "enumerate": enumerate,
                "zip": zip,
                "map": map,
                "filter": filter,
                "all": all,
                "any": any,
            }
        }
        safe_locals = {}
        
        # Execute the code
        exec(code, safe_globals, safe_locals)
        
        # Get the output
        result["output"] = captured_output.getvalue()
        
        # If there's no output from print statements, try to evaluate as expression
        if not result["output"].strip() and code.strip():
            try:
                # Try to evaluate as a single expression
                lines = code.strip().split('\n')
                if len(lines) == 1:
                    expr_result = eval(lines[0], safe_globals, safe_locals)
                    if expr_result is not None:
                        result["output"] = str(expr_result)
            except:
                pass
                
    except Exception as e:
        result["success"] = False
        result["error"] = str(e)
        stderr_content = captured_error.getvalue()
        if stderr_content:
            result["error"] += f"\n{stderr_content}"
            
    finally:
        # Restore stdout and stderr
        sys.stdout = old_stdout
        sys.stderr = old_stderr
    
    return result

def main():
    """Main function to handle command line execution"""
    if len(sys.argv) != 2:
        print(json.dumps({"success": False, "error": "No code provided"}))
        return
    
    code = sys.argv[1]
    result = execute_python_code(code)
    print(json.dumps(result))

if __name__ == "__main__":
    main()