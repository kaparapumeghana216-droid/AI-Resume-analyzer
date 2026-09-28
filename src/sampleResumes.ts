export interface SampleResume {
  label: string;
  role: string;
  content: string;
}

export const SAMPLE_RESUMES: SampleResume[] = [
  {
    label: "CS Undergraduate (Software Dev)",
    role: "Computer Science Sophomore",
    content: `ALEX RIVERA
Email: alex.rivera@university.edu | Phone: (555) 234-5678 | GitHub: github.com/alexrivera-dev | LinkedIn: linkedin.com/in/alexrivera

EDUCATION
State University, City, State
Bachelor of Science in Computer Science (Expected May 2027)
GPA: 3.75/4.00
Relevant Coursework: Data Structures & Algorithms, Object-Oriented Programming, Database Systems, Web Development, Computer Systems.

TECHNICAL SKILLS
- Programming Languages: Python, Java, JavaScript, TypeScript, C++, HTML5, CSS3, SQL
- Frameworks & Libraries: React, Node.js, Express, Tailwind CSS, NumPy, Pandas
- Tools & Platforms: Git, GitHub, VS Code, Postman, Linux, Vercel

PROJECTS
Campus Study Buddy (Full-Stack Web App)
- Developed a peer tutoring match platform using React, Node.js, Express, and PostgreSQL.
- Implemented JWT authentication and real-time chat utilizing WebSockets.
- Deployed frontend to Vercel and backend to Railway, serving 250+ university students during finals week.

Algorithmic Trading Backtester (Python)
- Built a backtesting tool to evaluate moving average crossover strategies using Pandas and Matplotlib.
- Analyzed historical stock data across 50+ tickers and calculated Sharpe ratios and drawdowns.
- Optimized simulation runtime by 35% using vectorized calculations.

Campus Food Delivery Tracker (Mobile Web)
- Created a responsive ordering dashboard for campus dining services using React and Tailwind CSS.
- Integrated OpenStreetMap API to display real-time order delivery status for students.

EXPERIENCE
Undergraduate Teaching Assistant - Intro to Computer Science | August 2024 - Present
- Conduct weekly lab sessions and office hours for 60+ freshman computer science students.
- Assist students in debugging Python programs, understanding recursion, and writing unit tests.

LEADERSHIP & ACTIVITIES
- Member, ACM Student Chapter
- Hackathon Participant: HackState 2024 (Built an AI-assisted campus navigation tool)`
  },
  {
    label: "Data Science & AI Student",
    role: "Junior Data Science Major",
    content: `PRIYA SHARMA
Email: priya.sharma@collegemail.edu | Portfolio: priyasharma.io | GitHub: github.com/priyasharma

EDUCATION
Metropolitan Institute of Technology
B.S. in Data Science & Artificial Intelligence (Expected Dec 2026)
GPA: 3.82/4.00
Dean's Honor List: 4 Semesters

TECHNICAL SKILLS
- Languages: Python, R, SQL, Bash
- ML/AI: Scikit-learn, TensorFlow, PyTorch, Hugging Face, OpenCV
- Data Analysis: Pandas, NumPy, Matplotlib, Seaborn, Tableau
- Databases & Tools: PostgreSQL, SQLite, Git, Docker, Jupyter Notebooks

PROJECTS
Healthcare Readmission Prediction System
- Developed a predictive machine learning model using Scikit-Learn and XGBoost to predict 30-day patient readmissions.
- Handled class imbalance using SMOTE and achieved an ROC-AUC score of 0.88 on 45,000+ patient records.
- Deployed interactive Streamlit web dashboard for clinical risk scoring.

Customer Sentiment Analysis Pipeline
- Built an NLP pipeline analyzing 12,000+ product reviews using BERT transformer embeddings.
- Visualized recurring customer pain points and satisfaction trends using Seaborn and interactive charts.

CAMPUS INVOLVEMENT & WORK
Student Data Analyst Intern - Campus Career Center | Jan 2025 - Present
- Automated student internship placement reporting using SQL queries and Python scripts, saving 8 staff hours per week.
- Built executive dashboards in Tableau summarizing employment outcomes across 12 academic departments.`
  },
  {
    label: "Frontend / Mobile Student",
    role: "Self-Taught Web Developer",
    content: `MARCUS CHEN
Email: marcus.chen@techmail.com | Portfolio: marcuschen.dev | GitHub: github.com/marcuschen

EDUCATION
City Community College
Associate of Science in Information Technology (Expected Dec 2025)
Relevant Courses: Web Development, Intro to Networks, Database Fundamentals

TECHNICAL SKILLS
- Frontend: HTML5, CSS3, JavaScript (ES6+), TypeScript, React, Next.js, Tailwind CSS
- State & APIs: Redux Toolkit, REST APIs, Fetch, Axios
- Tools: Git, GitHub, Figma, VS Code, Netlify, Vercel

PROJECTS
Recipe Finder & Meal Planner (React + Spoonacular API)
- Developed an interactive meal recipe search app featuring filter by dietary restrictions and calories.
- Integrated Spoonacular REST API and cached recipe requests with localStorage for 60% faster re-renders.
- Built accessible UI adhering to WCAG 2.1 AA standards with Tailwind CSS and responsive design.

Campus Fitness Club Portal
- Designed mobile-first schedule board for university intramural sports with 400+ weekly student views.
- Implemented dark mode toggle and real-time announcement notifications using Firebase Firestore.

ACTIVITIES
- Lead Organizer, Campus Web Dev Meetup (40+ active student members)
- 1st Place Winner, Local Community Hackathon 2024`
  }
];
