
#!/usr/bin/env python3
import sys
import json
import traceback
import contextlib
import io
import ast
import warnings
import subprocess
import os

class PythonExecutor:
    def __init__(self):
        self.globals_dict = {
            '__builtins__': {
                'print': print,
                'len': len,
                'range': range,
                'list': list,
                'dict': dict,
                'str': str,
                'int': int,
                'float': float,
                'bool': bool,
                'sum': sum,
                'max': max,
                'min': min,
                'abs': abs,
                'round': round,
                'sorted': sorted,
                'enumerate': enumerate,
                'zip': zip,
                'map': map,
                'filter': filter,
                'any': any,
                'all': all,
                'type': type,
                'isinstance': isinstance,
                'hasattr': hasattr,
                'getattr': getattr,
                'setattr': setattr,
                'dir': dir,
                'help': help,
            }
        }
        
    def is_safe_code(self, code):
        """Basic safety check for code execution"""
        dangerous_patterns = [
            'import os', 'import sys', 'import subprocess', 
            'import shutil', 'import glob', 'import socket',
            'exec(', 'eval(', '__import__', 'open(',
            'file(', 'input(', 'raw_input(', 'compile(',
            'reload(', 'delattr(', 'dir(', 'vars(',
            'locals(', 'globals(', '__builtins__'
        ]
        
        code_lower = code.lower()
        for pattern in dangerous_patterns:
            if pattern in code_lower:
                return False
        
        # Additional checks for file operations and network
        forbidden_keywords = ['file', 'socket', 'urllib', 'requests', 'http']
        for keyword in forbidden_keywords:
            if keyword in code_lower and ('import' in code_lower or 'from' in code_lower):
                return False
                
        return True
    
    def execute_code(self, code):
        """Execute Python code safely and return output"""
        if not self.is_safe_code(code):
            return {
                'success': False,
                'output': '',
                'error': 'Code contains potentially unsafe operations'
            }
        
        # Capture stdout
        output_buffer = io.StringIO()
        
        try:
            # Parse the code to check for syntax errors
            ast.parse(code)
            
            # Redirect stdout to capture print statements
            with contextlib.redirect_stdout(output_buffer):
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    
                    # Execute the code
                    result = eval(compile(code, '<string>', 'exec'), self.globals_dict)
                    
                    # If the last line is an expression, print its result
                    try:
                        lines = code.strip().split('\n')
                        last_line = lines[-1].strip()
                        if last_line and not last_line.startswith(('print', 'if', 'for', 'while', 'def', 'class', 'import', 'from')):
                            # Try to evaluate the last line as an expression
                            last_result = eval(last_line, self.globals_dict)
                            if last_result is not None:
                                print(last_result)
                    except:
                        pass
            
            output = output_buffer.getvalue()
            
            return {
                'success': True,
                'output': output.strip() if output.strip() else 'Code executed successfully',
                'error': None
            }
            
        except SyntaxError as e:
            return {
                'success': False,
                'output': '',
                'error': f'Syntax Error: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'output': output_buffer.getvalue(),
                'error': f'{type(e).__name__}: {str(e)}'
            }

def main():
    if len(sys.argv) != 2:
        print(json.dumps({
            'success': False,
            'output': '',
            'error': 'No code provided'
        }))
        return
    
    code = sys.argv[1]
    executor = PythonExecutor()
    result = executor.execute_code(code)
    print(json.dumps(result))

if __name__ == '__main__':
    main()
