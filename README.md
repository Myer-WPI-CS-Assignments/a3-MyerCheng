## Personal Gradebook

[https://a3-myercheng.onrender.com]

This application allows you to input your grades and stores them in persistent storage. 
The grading scale/technique is based on WPI grading, but may not 100% reflect WPI grading policy. 
A grade entry includes a class name, a numeric grade, a custom notes field, and a boolean flag for whether to count the class' grade in the overall average.
Some challenges I faced in implementing the application are:
- I initially used `<section>` to encompass the form in HTML, but this caused the MVP CSS library to center it, overlapping with other elements on the page.
  - Using `<article>` instead fixed this.

Authentication was implemented with standard hash + salt from a tutorial.

I used [MVP](https://andybrewer.github.io/mvp/) for my stylesheet. I wanted a minimalistic style sheet, and I think this one did the job well.
I used custom CSS only to center one of my buttons (the submit button), as well as to set some colors and to make the notes display wrap. 

## Technical Achievements
- **Tech Achievement 1**: I achieved 100% on all 4 lighthouse tests: ([image here](https://fs.myer.wtf/shares/6skux3gje757/lighthouse%20result.png))