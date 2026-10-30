import sys
from app.database import SessionLocal
from app.ai_copilot import gather_user_financial_context, generate_deterministic_answer

# Force UTF-8 stdout
sys.stdout.reconfigure(encoding='utf-8')

db = SessionLocal()
user_id = 'U036'
user_name = 'Alex Turner'
context = gather_user_financial_context(db, user_id, 'INR')

test_suites = {
    "English": [
        ("How much did I spend this month?", "**Your Spending Breakdown:**"),
        ("What is my Needs vs Wants breakdown?", "**Needs vs Wants Analysis (50/30 Rule):**"),
        ("Do I have any unusual expenses?", "**Unusual & Peak Spending Analysis:**"),
        ("What is my predicted expense for next month?", "**Next Month Expense Prediction:**"),
        ("How are my savings goals progressing?", "**Savings Goals Overview:**"),
        ("How can I improve my savings rate?", "**Personalized Savings Suggestions for You:**"),
        ("What is my current balance?", "**Current Balance & Cash Flow Status:**"),
        ("What is my total income?", "**Your Income Summary:**"),
        ("How much did I spend on rent?", "**Spending on Rent:**"),
        ("How much did I spend on groceries?", "**Spending on Groceries:**")
    ],
    "Hinglish": [
        ("Mera is mahine ka kharcha kitna hai?", "**Your Spending Breakdown:**"),
        ("Jarurat aur khwahish ka breakdown kya hai?", "**Needs vs Wants Analysis (50/30 Rule):**"),
        ("Koi achanak ya ajeeb kharcha hua kya?", "**Unusual & Peak Spending Analysis:**"),
        ("Agle mahine kitna kharch hoga andaza batao?", "**Next Month Expense Prediction:**"),
        ("Mere bachat goals ka status kya hai?", "**Savings Goals Overview:**"),
        ("Paise kaise bachaye kuch tips do?", "**Personalized Savings Suggestions for You:**"),
        ("Mera kitna balance bacha hai?", "**Current Balance & Cash Flow Status:**"),
        ("Meri kul kamai kitni hui?", "**Your Income Summary:**"),
        ("Mera rent ya kiraya kitna hai?", "**Spending on Rent:**"),
        ("Kirana aur ration par kitna kharcha hua?", "**Spending on Groceries:**")
    ],
    "Hindi (Devanagari)": [
        ("मेरा इस महीने का खर्च कितना है?", "**Your Spending Breakdown:**"),
        ("ज़रूरत और इच्छा का अनुपात क्या है?", "**Needs vs Wants Analysis (50/30 Rule):**"),
        ("क्या कोई असामान्य या बड़ा खर्च हुआ है?", "**Unusual & Peak Spending Analysis:**"),
        ("अगले महीने के खर्च का क्या अनुमान है?", "**Next Month Expense Prediction:**"),
        ("मेरे बचत लक्ष्य की प्रगति कैसी है?", "**Savings Goals Overview:**"),
        ("पैसे कैसे बचाएं और बचत दर कैसे सुधारें?", "**Personalized Savings Suggestions for You:**"),
        ("मेरा कुल बैलेंस कितना है?", "**Current Balance & Cash Flow Status:**"),
        ("मेरी कुल आय कितनी है?", "**Your Income Summary:**"),
        ("मकान किराया कितना दिया?", "**Spending on Rent:**"),
        ("राशन और किराना पर कितना खर्चा हुआ?", "**Spending on Groceries:**")
    ],
    "Marathi (Devanagari)": [
        ("या महिन्यात माझा एकूण खर्च किती झाला?", "**Your Spending Breakdown:**"),
        ("गरजा आणि इच्छांचे वर्गीकरण काय आहे?", "**Needs vs Wants Analysis (50/30 Rule):**"),
        ("काही असामान्य किंवा मोठा खर्च झाला आहे का?", "**Unusual & Peak Spending Analysis:**"),
        ("पुढच्या महिन्यात खर्चाचा अंदाज काय आहे?", "**Next Month Expense Prediction:**"),
        ("माझ्या बचत ध्येयांची प्रगती कशी आहे?", "**Savings Goals Overview:**"),
        ("पैसे कसे वाचवायचे आणि बचत कशी वाढवायची?", "**Personalized Savings Suggestions for You:**"),
        ("माझ्या खात्यात किती शिल्लक आहे?", "**Current Balance & Cash Flow Status:**"),
        ("माझे एकूण उत्पन्न किती आहे?", "**Your Income Summary:**"),
        ("घराचे भाडे किती आहे?", "**Spending on Rent:**"),
        ("किराणा मालावर किती खर्च झाला?", "**Spending on Groceries:**")
    ]
}

results = {}

print("================================================================================")
print("FINANCEIQ MULTILINGUAL NATURAL LANGUAGE QUERY EVALUATION REPORT")
print("================================================================================")

for lang, tests in test_suites.items():
    print(f"\n--- {lang} Test Suite ({len(tests)} Queries) ---")
    results[lang] = {"passed": 0, "total": len(tests), "details": []}
    for q, expected_header in tests:
        ans = generate_deterministic_answer(q, context, user_name)
        matched = expected_header in ans
        status = "PASS" if matched else "FAIL"
        first_line = ans.strip().split("\n")[0]
        if matched:
            results[lang]["passed"] += 1
        print(f"[{status}] Query: '{q}'")
        print(f"       Expected: {expected_header}")
        print(f"       Result:   {first_line}")
        results[lang]["details"].append((q, status, first_line))

print("\n================================================================================")
print("LANGUAGE BENCHMARK SUMMARY")
print("================================================================================")
for lang, stats in results.items():
    rate = (stats["passed"] / stats["total"]) * 100
    print(f"{lang:22}: {stats['passed']}/{stats['total']} queries passed ({rate:.1f}%)")

db.close()
