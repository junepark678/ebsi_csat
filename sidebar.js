/* eslint-env browser */
/* eslint-disable no-undef */

/**
 * @typedef {Object} Problem
 * @property {string} id - The problem ID
 * @property {string} display - The user-friendly display string
 */

/** @type {Problem[]} */
let problems = [];

/**
 * Generate problems based on the current form inputs
 */
async function generateProblems() {
    const titleInput = document.getElementById('title');
    const title = titleInput ? titleInput.value : '';
    const itemList = problems.map(p => p.id).join(',');

    try {
        let data = await fetch("https://ai-plus.ebs.co.kr/ebs/ai/xipa/createPaperAjax.ajax", {
            "credentials": "include",
            "headers": {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest",
            },
            "referrer": "https://ai-plus.ebs.co.kr/ebs/ai/xipa/ItemSearchPaper.ebs?sbjId=S01&globalGradeCd=1",
            "body": `title=${encodeURIComponent(title)}&desc=&subjectId=223120002&itemList=${encodeURIComponent(itemList)}&paperTypeId=99`,
            "method": "POST",
        });
        if (!data.ok) {
            console.error("Failed to generate problems:", data.statusText);
            return;
        }
        console.log("Problems generated successfully");
    } catch (error) {
        console.error("Error generating problems:", error);
    }
}

/**
 * Reset the entire page
 */
function resetPage() {
    // Clear form
    /** @type {HTMLFormElement | null} */
    const form = document.querySelector('form');
    if (form) {
        form.reset();
    }

    // Clear problems array
    problems = [];

    // Hide and clear problem list
    /** @type {HTMLElement | null} */
    const container = document.getElementById('problem-list-container');
    if (container) {
        container.style.display = 'none';
    }

    /** @type {HTMLElement | null} */
    const problemList = document.getElementById('problem-list');
    if (problemList) {
        problemList.innerHTML = '';
    }
}

/**
 * Delete a specific problem by index
 * @param {number} index - The index of the problem to delete
 */
function deleteProblem(index) {
    problems.splice(index, 1);
    updateProblemList();

    // Hide container if no problems left
    if (problems.length === 0) {
        /** @type {HTMLElement | null} */
        const container = document.getElementById('problem-list-container');
        if (container) {
            container.style.display = 'none';
        }
    }
}

/**
 * Update the problem list display
 */
function updateProblemList() {
    /** @type {HTMLElement | null} */
    const problemList = document.getElementById('problem-list');
    console.log(problemList);
    if (!problemList) return;

    problemList.innerHTML = '';

    problems.forEach((problem, index) => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        li.style.marginBottom = '5px';

        const span = document.createElement('span');
        span.textContent = problem.display;

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '삭제';
        deleteBtn.type = 'button';
        deleteBtn.style.marginLeft = '10px';
        deleteBtn.addEventListener('click', () => deleteProblem(index));

        li.appendChild(span);
        li.appendChild(deleteBtn);
        problemList.appendChild(li);
        console.log(`Added problem: ${problem.display} (ID: ${problem.id})`);
    });
}

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Add event listener for generate button
    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateProblems);
    }

    // Add event listeners for reset and clear buttons
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetPage);
    }

    const clearBtn = document.getElementById('clear-problems-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            problems = [];
            updateProblemList();
            /** @type {HTMLElement | null} */
            const container = document.getElementById('problem-list-container');
            if (container) {
                container.style.display = 'none';
            }
        });
    }

    const problemForm = document.getElementById('problem-form');
    if (problemForm) {
        problemForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            /** @type {HTMLFormElement} */
            const form = this;

            const grade = form.grade.value;
            const subject = form.subject.value;
            let month = form.month.value;
            const year = form.year.value || new Date().getFullYear();
            const selectedProblems = form['problem-ids'].value.split(',').map(id => id.trim()).filter(id => id);

            // Subject name mapping
            /** @type {Record<string, string>} */
            const subjectNames = {
                '1': '국어',
                '2': '수학',
                '3': '영어',
                '4': '한국사',
                '5': '사회탐구',
                '6': '과학탐구',
                '7': '직업탐구',
                '8': '제2외국어/한문'
            };

            // Month must be two digits, with leading zero if necessary
            if (month.length === 1) {
                month = '0' + month;
            }

            /** @type {Record<string, string>} */
            let query = {
                "beginYear": "" + year,
                "currentPage": "1",
                "endYear": "" + year,
                "monthList": "" + month,
                "pageSize": "10",
                "sort": "recent",
                "subjList": "" + subject,
                "targetCd": `D${grade}00`
            };

            /** @type {Response} */
            let data = await fetch("https://www.ebsi.co.kr/ebs/xip/xipc/previousPaperListAjax.ajax", {
                "credentials": "include",
                "headers": {
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "X-Requested-With": "XMLHttpRequest",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-origin",
                    "Priority": "u=0"
                },
                "referrer": "https://www.ebsi.co.kr/ebs/xip/xipc/previousPaperList.ebs?targetCd=D100",
                "body": new URLSearchParams(query).toString(),
                "method": "POST"
            });
            if (!data.ok) {
                console.error("Failed to fetch data:", data.statusText);
                return;
            }
            /** @type {string} */
            let body = await data.text();
            if (!body) {
                console.error("No data received");
                return;
            }
            // body is an HTML string, parse it to extract problem IDs
            const parser = new DOMParser();
            const doc = parser.parseFromString(body, 'text/html');
            // example: XPath is /html/body/div[2]/section/div/div[2]/div/form/div[2]/ul/li[50]/div[3]/div[2]/button[2] for 50th problem
            const examElements = doc.querySelectorAll('li > div > div > button:nth-child(2)');

            /** @type {string[]} */
            let examIds = [];

            // dynamically load problem IDs based on selected options
            examElements.forEach(element => {
                // <button type="button" class="btn_popup_test" onclick="paperOn('3417953', '2013 고1 3월 학평(부산)수학', '0', '2013');"><span>응시하기</span></button>
                const examId = element.getAttribute('onclick')?.match(/paperOn\('(\d+)'/);
                if (examId) {
                    examIds.push(examId[1]);
                }
            });

            examIds.forEach(async id => {
                /** @type {Response} */
                let data = await fetch("https://ai-plus.ebs.co.kr/ebs/xip/retrieveSCVWebPaperStat.ajax", {
                    "credentials": "include",
                    "headers": {
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "X-Requested-With": "XMLHttpRequest",
                    },
                    "referrer": "https://ai-plus.ebs.co.kr/ebs/xip/solvePaper.ebs",
                    "body": `suffixSite=&isInsite=Y&site=HSC&isMoc=1&paperId=${id}`,
                    "method": "POST",
                    "mode": "cors"
                });
                /** @type {any} */
                let json = await data.json();
                if (!json || !json.data) {
                    console.error("No valid data received for exam ID:", id);
                    return;
                }
                selectedProblems.forEach(problemNum => {
                    const problem = json.data[problemNum-1];
                    if (problem && problem.CORRECT_RATE > 0) {
                        const problemString = `${year}년 고${grade} ${month}월 ${subjectNames[subject]} ${problemNum}번`;
                        problems.push({
                            id: problem.ITEM_ID,
                            display: problemString
                        });
                    }
                });
            });

            // Update problem list display
            setTimeout(updateProblemList, 200);

            /** @type {HTMLElement | null} */
            const container = document.getElementById('problem-list-container');
            if (container && problems.length > 0) {
                container.style.display = 'block';
            }

            console.log(`학년: ${grade}, 과목: ${subject}, 월: ${month}`);
        });
    }
});
