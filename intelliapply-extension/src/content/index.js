// Scraper Content Script

function getMeta(name) {
    return document.querySelector(`meta[name="${name}"]`)?.content ||
        document.querySelector(`meta[property="${name}"]`)?.content || '';
}

function scrapeJobDetails() {
    console.log('IntelliApply: Scraping job details...');
    let job = {
        title: '',
        company: '',
        location: '',
        description: '',
        url: window.location.href
    };

    // 0. LinkedIn Specific Logic
    if (window.location.hostname.includes('linkedin.com')) {
        console.log('IntelliApply: LinkedIn detected');

        // Strategy A: Specific Selectors (Best Quality)
        const titleEl = document.querySelector('.job-details-jobs-unified-top-card__job-title') ||
            document.querySelector('.t-24') ||
            document.querySelector('.jobs-details-top-card__job-title');

        const companyEl = document.querySelector('.job-details-jobs-unified-top-card__company-name') ||
            document.querySelector('.job-details-jobs-unified-top-card__primary-description a') ||
            document.querySelector('.jobs-details-top-card__company-url');

        const locationEl = document.querySelector('.job-details-jobs-unified-top-card__primary-description span') ||
            document.querySelector('.job-details-jobs-unified-top-card__primary-description') ||
            document.querySelector('.jobs-details-top-card__bullet');

        const descEl = document.querySelector('#job-details') ||
            document.querySelector('.jobs-description__content') ||
            document.querySelector('.jobs-box__html-content');

        if (titleEl) job.title = titleEl.innerText.trim();
        if (companyEl) job.company = companyEl.innerText.trim();
        if (locationEl) job.location = locationEl.innerText.trim();
        if (descEl) job.description = descEl.innerText.trim();

        // **Strategy C: Split View / Right Rail Scoped Heuristics (Priority High)**
        // In Search View, the global H1 is "Search". We need the H2 inside the right rail.
        if (!job.title || job.title === 'LinkedIn') {
            const detailContainer = document.querySelector('.jobs-search__right-rail') ||
                document.querySelector('.scaffold-layout__detail') ||
                document.querySelector('.jobs-details__main-content'); // Mobile/Narrow

            if (detailContainer) {
                console.log('IntelliApply: Split View Container Found. Scoping search...');

                // Look for header inside this container
                // In split view, title is often an H2 or a link with class t-24 or similar
                const scopedTitle = detailContainer.querySelector('h2') ||
                    detailContainer.querySelector('.t-bold') || // Generic bold text check if H2 fails
                    detailContainer.querySelector('[class*="job-title"]');

                if (scopedTitle && scopedTitle.innerText.length > 5) {
                    job.title = scopedTitle.innerText.trim();
                    console.log('IntelliApply: Found Title via Split View Scope', job.title);
                }

                // Look for company link inside this container
                const scopedCompany = detailContainer.querySelector('a[href*="/company/"]');
                if (scopedCompany) {
                    job.company = scopedCompany.innerText.trim();
                    console.log('IntelliApply: Found Company via Split View Scope', job.company);
                }

                // Try to find description in this scope if missing
                if (!job.description) {
                    const scopedDesc = detailContainer.querySelector('#job-details') ||
                        detailContainer.querySelector('[class*="description"]');
                    if (scopedDesc) job.description = scopedDesc.innerText.trim();
                }
            }
        }

        // **Strategy B: Broad Heuristics (Fallback)**

        // 1. H1 Fallback: On almost every job page, the Job Title is the main H1.
        if (!job.title || job.title === 'LinkedIn') {
            const h1 = document.querySelector('h1');
            if (h1 && h1.innerText.length > 3 && !h1.innerText.includes('LinkedIn')) {
                job.title = h1.innerText.trim();
                console.log('IntelliApply: Found Title via H1 Heuristic', job.title);
            }
        }

        // 2. Company Link Fallback: Look for links to company pages
        if (!job.company) {
            const companyLink = document.querySelector('a[href*="/company/"]');
            if (companyLink) {
                job.company = companyLink.innerText.trim();
                console.log('IntelliApply: Found Company via Link Heuristic', job.company);
            }
        }

        // 3. Document Title parsing (Last Resort)
        // Format often: "Job Title at Company | LinkedIn" or "Job Title | Company | LinkedIn"
        if (!job.title || job.title === 'LinkedIn') {
            const docTitle = document.title;
            const parts = docTitle.split(/ \| | at | - /); // Split by common separators
            if (parts.length >= 2) {
                job.title = parts[0].trim();
                // If the second part isn't "LinkedIn", it might be company
                if (parts[1] && !parts[1].includes('LinkedIn')) {
                    job.company = parts[1].trim();
                }
                console.log('IntelliApply: Found Title via Document Title Parse', job.title);
            }
        }

        // Validation: If title is strictly "LinkedIn", generic "Jobs", or "Feed", kill it.
        const invalidTitles = ['LinkedIn', 'Feed', 'Jobs', 'Home', 'Notifications', 'Messaging'];
        if (invalidTitles.includes(job.title)) {
            console.log('IntelliApply: Invalid Title detected after heuristics:', job.title);
            job.title = '';
        }

        if (job.title && (job.description || descEl)) { // Allow valid title even if description is partial
            return job;
        }
    }

    // 1. Try JSON-LD
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
        try {
            const json = JSON.parse(script.innerText);
            const data = Array.isArray(json) ? json[0] : json; // Handle array or single object

            if (data['@type'] === 'JobPosting') {
                job.title = data.title || '';
                job.company = data.hiringOrganization?.name || '';
                job.location = data.jobLocation?.address?.addressLocality || '';
                job.description = data.description || '';
                console.log('IntelliApply: Found JSON-LD JobPosting');
                break;
            }
        } catch (e) {
            console.error('JSON-LD parse error', e);
        }
    }

    // 2. Fallback to Meta Tags (OG / Page Data)
    if (!job.title) {
        job.title = getMeta('og:title') || document.title;
        // Heuristic cleaning: "Job Title | Company"
        if (job.title.includes(' | ')) {
            [job.title, job.company] = job.title.split(' | ');
        }
    }

    if (!job.description) {
        job.description = getMeta('og:description') || '';
    }

    // 3. Selection Fallback (User selected text)
    const selection = window.getSelection().toString();
    if (selection && selection.length > 50) {
        console.log('IntelliApply: Using user selection for description');
        job.description = selection;
        if (!job.title) job.title = "Selected Job";
    }

    // 4. Simple text fallback
    if (!job.description) {
        // Very generic fallback
        job.description = document.body.innerText.substring(0, 500) + '...';
    }

    // Clean HTML from description if needed (JSON-LD often has HTML)
    if (job.description.includes('<')) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = job.description; // Warning: sanitized in context of extension? 
        job.description = tempDiv.innerText;
    }

    return job;
}

// Listener for messages from Side Panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'SCRAPE_JOB') {
        const data = scrapeJobDetails();
        sendResponse(data);
    }
    return true; // Keep channel open
});

// UI INJECTION REMOVED AS PER USER REQUEST
// The side panel should be opened via the browser action (extension icon) or context menu.
