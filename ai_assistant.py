from openai import OpenAI

# يفضل دائماً استخدام متغيرات البيئة لمفتاح الـ API بدلاً من كتابته مباشرة في الكود
client = OpenAI(api_key="YOUR_API_KEY")

def ask_ai(prompt):
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}]
    )
    # الطريقة الجديدة للوصول إلى محتوى الرد
    return response.choices[0].message.content

# مثال: شرح كود
code = """
def calculate_average(numbers):
    return sum(numbers) / len(numbers)
"""
print(ask_ai(f"شرح هذا الكود:\n{code}"))
