// API Key
const API_KEY = 'f5e929d7efca2c41af57c13ae8f75e9f';
const BASE_URL = 'https://api.mediastack.com/v1/news';

// State variables
let currentPage = 1;
let currentCategory = 'general';
let currentSearchQuery = '';
let articles = [];
let isLoading = false;

// DOM elements
const newsContainer = document.getElementById('news-container');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const categoryBtns = document.querySelectorAll('.category-btn');
const loadMoreBtn = document.getElementById('load-more');
const loader = document.getElementById('loader');
const errorMessage = document.getElementById('error-message');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Add animation when page loads
    document.body.classList.add('fade-in');
    
    // Initialize news fetch
    fetchNews();
    setupEventListeners();
    setupLazyLoading();
    
    // Focus search input
    setTimeout(() => {
        searchInput.focus();
    }, 1000);
});

function setupEventListeners() {
    // Search button click
    searchBtn.addEventListener('click', () => {
        if (isLoading) return;
        
        currentSearchQuery = searchInput.value.trim();
        currentPage = 1;
        clearNews();
        fetchNews();
        
        // Track search analytics (if implemented)
        if (currentSearchQuery) {
            console.log(`Search query: ${currentSearchQuery}`);
        }
    });
    
    // Search on Enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });
    
    // Category filter clicks
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isLoading) return;
            
            // Remove active class from all buttons
            categoryBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button with animation
            btn.classList.add('active');
            
            // Apply subtle animation
            btn.classList.add('pulse');
            setTimeout(() => {
                btn.classList.remove('pulse');
            }, 500);
            
            // Update category and fetch news
            currentCategory = btn.dataset.category;
            currentPage = 1;
            clearNews();
            fetchNews();
        });
    });
    
    // Load more button
    loadMoreBtn.addEventListener('click', () => {
        if (isLoading) return;
        
        currentPage++;
        fetchNews(true);
        
        // Add loading animation to button
        loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        loadMoreBtn.disabled = true;
        
        setTimeout(() => {
            loadMoreBtn.disabled = false;
            loadMoreBtn.innerHTML = 'Load More <i class="fas fa-chevron-down"></i>';
        }, 1000);
    });
    
    // Smooth scroll to top for header
    document.querySelector('header').addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

function fetchNews(append = false) {
    // Prevent multiple simultaneous requests
    if (isLoading) return;
    isLoading = true;
    
    // Show loader, hide error
    loader.style.display = 'block';
    errorMessage.style.display = 'none';
    
    if (!append) {
        // Remove existing news if not appending
        newsContainer.innerHTML = '';
    }
    
    // Construct URL for Mediastack API
    let url = `${BASE_URL}?access_key=${API_KEY}&countries=in&limit=12&offset=${(currentPage - 1) * 12}`;
    
    // Add category if not "general"
    if (currentCategory !== 'general') {
        url += `&categories=${currentCategory}`;
    }
    
    // Add search query if present
    if (currentSearchQuery) {
        url += `&keywords=${encodeURIComponent(currentSearchQuery)}`;
    }
    
    // Add sort parameter
    url += '&sort=published_desc';
    
    // Fetch news
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            isLoading = false;
            loader.style.display = 'none';
            
            if (data.data && data.data.length > 0) {
                // If no more articles to load, hide load more button
                if (data.data.length < 12) {
                    loadMoreBtn.style.display = 'none';
                } else {
                    loadMoreBtn.style.display = 'block';
                }
                
                // If not appending, clear the articles array
                if (!append) {
                    articles = [];
                }
                
                // Filter out articles without images or descriptions if we have enough
                let filteredArticles = data.data;
                if (data.data.length > 6) {
                    filteredArticles = data.data.filter(article => 
                        article.image && article.description && article.description.trim() !== ''
                    );
                    
                    // If filtering removed too many, use original
                    if (filteredArticles.length < 4) {
                        filteredArticles = data.data;
                    }
                }
                
                // Add new articles to array
                articles = [...articles, ...filteredArticles];
                
                // Render articles
                renderNews(filteredArticles, append);
                
                // Show category counts
                updateCategoryLabel(currentCategory, data.pagination?.total || filteredArticles.length);
            } else {
                if (!append) {
                    newsContainer.innerHTML = `
                        <div class="error-message" style="display:block;">
                            <i class="fas fa-search"></i>
                            <p>No news found for "${currentSearchQuery || currentCategory}". Try a different search or category.</p>
                        </div>
                    `;
                }
                loadMoreBtn.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error fetching news:', error);
            isLoading = false;
            loader.style.display = 'none';
            errorMessage.style.display = 'block';
            errorMessage.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading news. Please try again later.</p>
                <small>${error.message}</small>
            `;
        });
}

function renderNews(newsItems, append = false) {
    if (!append) {
        newsContainer.innerHTML = '';
    }
    
    newsItems.forEach((item, index) => {
        const newsCard = document.createElement('div');
        newsCard.className = 'news-card';
        newsCard.style.animationDelay = `${0.1 * (index % 10)}s`;
        
        // Determine category display name
        let categoryName = 'General';
        categoryBtns.forEach(btn => {
            if (btn.dataset.category === currentCategory) {
                categoryName = btn.textContent;
            }
        });
        
        // Format date
        const publishedDate = new Date(item.published_at || Date.now());
        const formattedDate = publishedDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        // Truncate description if too long
        const description = item.description 
            ? item.description.length > 120 
                ? item.description.substring(0, 120) + '...' 
                : item.description
            : 'No description available.';
            
        // Create a nice placeholder if no image
        const imagePlaceholder = !item.image 
            ? `/api/placeholder/600/400?text=${encodeURIComponent(categoryName)}+News`
            : item.image;
        
        newsCard.innerHTML = `
            <div class="news-image lazy-image" data-src="${imagePlaceholder}"></div>
            <div class="news-content">
                <div class="news-category">${item.category || categoryName}</div>
                <h3 class="news-title">${item.title || 'No Title'}</h3>
                <p class="news-description">${description}</p>
                <div class="news-footer">
                    <span class="news-source">${item.source || 'Unknown Source'}</span>
                    <span class="news-date"><i class="far fa-calendar-alt"></i> ${formattedDate}</span>
                </div>
            </div>
        `;
        
        // Make the entire card clickable
        newsCard.addEventListener('click', () => {
            // Track click analytics
            console.log(`Article clicked: ${item.title}`);
            // Open in new tab
            window.open(item.url, '_blank');
        });
        
        // Add hover effect cue
        newsCard.addEventListener('mouseenter', () => {
            newsCard.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
        });
        
        newsContainer.appendChild(newsCard);
    });
    
    // Initialize lazy loading for newly added images
    initializeLazyImages();
}

function clearNews() {
    newsContainer.innerHTML = '';
    // Add skeleton loading effect
    for (let i = 0; i < 6; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'news-card skeleton-card skeleton';
        newsContainer.appendChild(skeleton);
    }
}

function updateCategoryLabel(category, count) {
    // Optional: Update title to show results count
    const categoryName = Array.from(categoryBtns).find(btn => 
        btn.dataset.category === category
    )?.textContent || 'News';
    
    if (count !== undefined) {
        document.querySelector('.app-subtitle').textContent = 
            `${count}+ ${categoryName} articles available`;
    }
}

// Implement lazy loading for images
function setupLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const lazyImage = entry.target;
                    const src = lazyImage.getAttribute('data-src');
                    
                    if (src) {
                        lazyImage.style.backgroundImage = `url('${src}')`;
                        lazyImage.classList.add('loaded');
                        imageObserver.unobserve(lazyImage);
                    }
                }
            });
        }, {
            rootMargin: '100px 0px',
            threshold: 0.01
        });
        
        // Initialize for existing images
        initializeLazyImages(imageObserver);
    } else {
        // Fallback for browsers without IntersectionObserver support
        document.querySelectorAll('.lazy-image').forEach(img => {
            const src = img.getAttribute('data-src');
            if (src) {
                img.style.backgroundImage = `url('${src}')`;
            }
        });
    }
}

function initializeLazyImages(observer) {
    const lazyImages = document.querySelectorAll('.lazy-image:not(.loaded)');
    
    if (!observer) {
        // Get the observer instance if not provided
        if ('IntersectionObserver' in window) {
            observer = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const lazyImage = entry.target;
                        const src = lazyImage.getAttribute('data-src');
                        
                        if (src) {
                            lazyImage.style.backgroundImage = `url('${src}')`;
                            lazyImage.classList.add('loaded');
                            obs.unobserve(lazyImage);
                        }
                    }
                });
            }, {
                rootMargin: '100px 0px',
                threshold: 0.01
            });
        }
    }
    
    if (observer) {
        lazyImages.forEach(lazyImage => {
            observer.observe(lazyImage);
        });
    } else {
        // Fallback for browsers without IntersectionObserver support
        lazyImages.forEach(img => {
            const src = img.getAttribute('data-src');
            if (src) {
                img.style.backgroundImage = `url('${src}')`;
                img.classList.add('loaded');
            }
        });
    }
}

// Add window resize handler for responsive adjustments
window.addEventListener('resize', () => {
    // Adjust layout if needed
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
        // Adjust for mobile if needed
        document.body.classList.add('mobile-view');
    } else {
        document.body.classList.remove('mobile-view');
    }
});

// Add scroll to top button functionality
function setupScrollToTop() {
    const scrollBtn = document.createElement('button');
    scrollBtn.className = 'scroll-top-btn';
    scrollBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    document.body.appendChild(scrollBtn);
    
    // Show/hide based on scroll position
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });
    
    // Scroll to top on click
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Initialize scroll to top functionality
setupScrollToTop();