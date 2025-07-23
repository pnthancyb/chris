
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
        # Try to import scientific libraries safely
        available_modules = {
            'math': __import__('math'),
            'random': __import__('random'),
            'datetime': __import__('datetime'),
            'json': __import__('json'),
        }
        
        # Try to add scientific computing libraries if available
        try:
            available_modules['numpy'] = __import__('numpy')
            available_modules['np'] = available_modules['numpy']
        except ImportError:
            pass
            
        try:
            available_modules['pandas'] = __import__('pandas')
            available_modules['pd'] = available_modules['pandas']
        except ImportError:
            pass
            
        self.globals_dict = {
            '__builtins__': {
                'print': print,
                'len': len,
                'range': range,
                'list': list,
                'dict': dict,
                'set': set,
                'tuple': tuple,
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
                'chr': chr,
                'ord': ord,
                'bin': bin,
                'hex': hex,
                'oct': oct,
                'pow': pow,
                'divmod': divmod,
                'slice': slice,
            }
        }
        
        # Add available modules
        self.globals_dict.update(available_modules)
        
    def is_safe_code(self, code):
        """Basic safety check for code execution"""
        dangerous_patterns = [
            'import os', 'import sys', 'import subprocess', 
            'import shutil', 'import glob', 'import socket',
            'exec(', 'eval(', '__import__', 'open(',
            'file(', 'input(', 'raw_input(', 'compile(',
            'reload(', 'delattr(', '__builtins__',
            'while True:', 'for i in range(999999)'
        ]
        
        code_lower = code.lower()
        
        # Allow basic scientific computing imports
        allowed_imports = ['math', 'random', 'datetime', 'json', 'numpy', 'pandas', 'matplotlib']
        
        # Check for dangerous patterns
        for pattern in dangerous_patterns:
            if pattern in code_lower:
                return False
        
        # Check imports more carefully
        import_lines = [line.strip() for line in code.split('\n') if 'import' in line.lower()]
        for line in import_lines:
            line_lower = line.lower()
            if 'import' in line_lower:
                # Extract the module name
                if 'from' in line_lower:
                    parts = line_lower.split('from')[1].split('import')[0].strip()
                else:
                    parts = line_lower.split('import')[1].strip()
                
                module_name = parts.split('.')[0].split(' ')[0]
                
                if module_name not in allowed_imports and module_name not in self.globals_dict:
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
