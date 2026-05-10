import unittest
from app import get_ai_analysis

class TestAIPrompts(unittest.TestCase):
    def test_ai_analysis_mock(self):
        # We test with Gemini API Key missing or present
        mode = "6v6"
        map_name = "Paraíso"
        comp = ["Hazard", "Ramattra", "Pharah", "Baptiste", "Sombra", "Kiriko"]
        
        result = get_ai_analysis(mode, map_name, comp)
        self.assertIsNotNone(result)
        self.assertIsInstance(result, str)
        print(f"Test AI Result: {result}")

if __name__ == "__main__":
    unittest.main()
