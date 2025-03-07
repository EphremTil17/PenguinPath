document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing script...');
    
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            // Toggle between hamburger and X icon
            const icon = mobileMenuBtn.querySelector('i');
            if (icon.classList.contains('fa-bars')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80, // Account for header height
                    behavior: 'smooth'
                });
            }
        });
    });

    // Search functionality for blog page
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        console.log('Search input found, adding event listener');
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const blogCards = document.querySelectorAll('.blog-card');
            console.log(`Searching for: ${searchTerm} among ${blogCards.length} cards`);
            
            blogCards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const description = card.querySelector('p').textContent.toLowerCase();
                const tags = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase());
                
                const isVisible = 
                    title.includes(searchTerm) || 
                    description.includes(searchTerm) || 
                    tags.some(tag => tag.includes(searchTerm));
                
                card.style.display = isVisible ? 'block' : 'none';
            });
        });
    } else {
        console.log('Search input not found on this page');
    }

    // Blog page: Load markdown files
    const blogGrid = document.querySelector('.blog-grid');
    if (blogGrid) {
        console.log('Blog grid found, loading markdown files');
        loadBlogPosts(blogGrid);
    } else {
        console.log('Blog grid not found on this page');
    }

    // Post page: Load specific markdown
    const markdownContent = document.getElementById('markdown-content');
    if (markdownContent) {
        console.log('Markdown content area found, loading specific post');
        const urlParams = new URLSearchParams(window.location.search);
        const filename = urlParams.get('file');
        
        if (filename) {
            console.log(`Loading post: ${filename}`);
            loadMarkdownPost(filename, markdownContent);
        } else {
            console.log('No filename specified in URL');
            markdownContent.innerHTML = '<div class="error">No post specified</div>';
        }
    } else {
        console.log('Markdown content area not found on this page');
    }

    // Theme toggle functionality
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            // Toggle dark mode
            if (document.documentElement.getAttribute('data-theme') === 'dark') {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            }
            
            // Re-apply syntax highlighting after theme change
            if (typeof Prism !== 'undefined') {
                setTimeout(() => {
                    Prism.highlightAll();
                }, 10);
            }
        });
        
        // Check for saved user preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }
});

// Load all blog posts into the blog grid
function loadBlogPosts(blogGrid) {
    // Show loading message
    blogGrid.innerHTML = '<div class="loading">Loading posts...</div>';
    
    console.log('Fetching markdown-list.json');
    
    // Fetch the list of markdown files
    fetch('markdown-list.json')
        .then(response => {
            console.log(`markdown-list.json response status: ${response.status}`);
            if (!response.ok) {
                throw new Error('Failed to fetch markdown file list');
            }
            return response.json();
        })
        .then(files => {
            // Clear loading message
            blogGrid.innerHTML = '';
            
            console.log(`Processing ${files.length} markdown files from JSON`);
            
            // Sort files by date (newest first)
            files.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Track loading progress
            let loadedCount = 0;
            const totalFiles = files.length;
            
            // Process each file
            files.forEach(file => {
                // Inside the fetch callback where title extraction happens
                fetch(`markdown/${file.filename}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${file.filename}`);
                    }
                    return response.text();
                })
                .then(content => {
                    // More robust title extraction
                    let title = file.filename.replace('.md', '').replace(/_/g, ' ');
                    
                    // Extract title from the first heading in the Markdown file
                    // Look for lines that start with # (with possible whitespace before it)
                    const headingRegex = /^\s*#\s+(.+)$/m;
                    const titleMatch = content.match(headingRegex);
                    
                    if (titleMatch && titleMatch[1]) {
                        console.log(`Found title in ${file.filename}: "${titleMatch[1]}"`);
                        title = titleMatch[1].trim();
                    } else {
                        console.warn(`No title found in ${file.filename}, using filename`);
                    }
                    
                    // Continue with the rest of the code...
                    const description = extractDescription(content);
                    
                    // Create the blog card with extracted content and metadata from JSON
                    const blogCard = document.createElement('div');
                    blogCard.className = 'blog-card';
                    
                    blogCard.innerHTML = `
                        <div class="blog-card-content">
                            <h3>${title}</h3>
                            <p>${description}</p>
                            <div class="tags">
                                ${file.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                            </div>
                            <a href="post.html?file=${file.filename}" class="read-more">
                                Read More <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                    `;
                        
                        blogGrid.appendChild(blogCard);
                        console.log(`Blog card for ${file.filename} added to the grid`);
                        
                        // Update progress
                        loadedCount++;
                        if (loadedCount === totalFiles) {
                            console.log('All blog posts loaded successfully');
                            
                            // Re-initialize animation observers after all cards are loaded
                            initializeAnimations();
                        }
                    })
                    .catch(error => {
                        console.error(`Error processing ${file.filename}:`, error);
                        
                        // Create error card for this file
                        const errorCard = document.createElement('div');
                        errorCard.className = 'blog-card error-card';
                        errorCard.innerHTML = `
                            <div class="blog-card-content">
                                <h3>Error loading: ${file.filename}</h3>
                                <p>This content could not be loaded. Please try again later.</p>
                            </div>
                        `;
                        blogGrid.appendChild(errorCard);
                        
                        // Update progress
                        loadedCount++;
                        if (loadedCount === totalFiles) {
                            console.log('All blog posts processed (with some errors)');
                            initializeAnimations();
                        }
                    });
            });
        })
        .catch(error => {
            console.error('Error loading markdown file list:', error);
            blogGrid.innerHTML = `
                <div class="error">
                    <h3>Error loading posts</h3>
                    <p>${error.message}</p>
                </div>
            `;
        });
}

// Helper function to extract description from markdown content
function extractDescription(content) {
    // Remove any markdown formatting for the description
    const strippedContent = content
        .replace(/^#+\s+[^\n]+/gm, '') // Remove headings
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
        .replace(/(\*\*|__)(.*?)\1/g, '$2') // Remove bold
        .replace(/(\*|_)(.*?)\1/g, '$2') // Remove italic
        .trim();

    // Find the first non-empty paragraph
    const paragraphs = strippedContent.split(/\n\s*\n/);
    for (const para of paragraphs) {
        const cleaned = para.trim();
        if (cleaned) {
            const description = cleaned.substring(0, 150);
            return cleaned.length > 150 ? description + '...' : description;
        }
    }
    
    return 'A comprehensive Linux guide to help solve common issues and improve your system.';
}

// Initialize animations for newly added elements
function initializeAnimations() {
    const newCards = document.querySelectorAll('.blog-card:not(.in-view)');
    if (newCards.length > 0) {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        });
        
        newCards.forEach(card => {
            observer.observe(card);
        });
    }
}

// Load and display a specific markdown post
function loadMarkdownPost(filename, contentArea) {
    console.log(`Loading post content for ${filename}`);
    
    // Show loading message
    contentArea.innerHTML = '<p>Loading content...</p>';
    
    // Try to load the markdown file
    fetch(`markdown/${filename}`)
        .then(response => {
            console.log(`Response for post ${filename}: status ${response.status}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${filename}: ${response.status}`);
            }
            return response.text();
        })
        .then(text => {
            console.log(`Content received for post ${filename}, length: ${text.length}`);
            
            // Update the title with more robust regex
            const titleElement = document.getElementById('markdown-title');
            if (titleElement) {
                const headingRegex = /^\s*#\s+(.+)$/m;
                const titleMatch = text.match(headingRegex);
                const title = titleMatch && titleMatch[1] 
                    ? titleMatch[1].trim() 
                    : filename.replace('.md', '').replace(/_/g, ' ');
                
                titleElement.textContent = title;
                console.log(`Title for post: ${title}`);
            }

            // Parse and display the markdown using marked.js
            const html = parseMarkdown(text);
            contentArea.innerHTML = html;
            console.log('Post content parsed and displayed');
            
            // Add syntax highlighting if prism.js is included
            if (typeof Prism !== 'undefined') {
                Prism.highlightAll();
            }
        })
        .catch(error => {
            console.error(`Error loading markdown post:`, error);
            contentArea.innerHTML = `
                <div class="error">
                    <h3>Error loading content</h3>
                    <p>${error.message}</p>
                    <p>Please try again later or contact the site administrator.</p>
                </div>
            `;
        });
}

// Parse markdown text to HTML using marked.js
function parseMarkdown(text) {
    console.log('Parsing markdown with marked.js, length:', text.length);
    
    // Configure marked options
    marked.setOptions({
        breaks: true,         // Add <br> on single line breaks
        gfm: true,            // Use GitHub Flavored Markdown
        headerIds: true,      // Add ids to headers for linking
        mangle: false,        // Don't escape HTML
        sanitize: false,      // Don't sanitize HTML (use with caution)
        smartLists: true,     // Use smarter list behavior
        smartypants: true,    // Use "smart" typographic punctuation
        xhtml: false          // Don't close singleton tags with a slash
    });
    
    // Parse the markdown using marked
    return marked.parse(text);
}