
const EDAMAM_APP_ID = '91a8ab2e'; // Register at https://developer.edamam.com/
const EDAMAM_APP_KEY = '787c1ee4f3feb29de7cf3a620b1a4461';
const EDAMAM_URL = 'https://api.edamam.com/api/recipes/v2';

let recipes = [];
let allRecipes = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let apiLimitReached = false;
let currentSection = 'home';
let showSimilarToFavorites = true;
let favoriteRecipes = JSON.parse(localStorage.getItem('favoriteRecipes')) || [];

// Mock Data
function getMockRecipes(searchTerm = '') {
    const allMockRecipes = [
        {
            id: "101",
            title: "Classic Spaghetti Carbonara",
            ingredients: ["spaghetti", "eggs", "pancetta", "parmesan", "black pepper"],
            cookTime: "20 mins",
            image: "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
            id: "102",
            title: "Vegetable Stir Fry",
            ingredients: ["broccoli", "carrots", "bell peppers", "soy sauce", "garlic"],
            cookTime: "15 mins",
            image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
            id: "103",
            title: "Chicken Noodle Soup",
            ingredients: ["chicken", "noodles", "carrots", "celery", "onion"],
            cookTime: "30 mins",
            image: "https://plus.unsplash.com/premium_photo-1705406168512-a062aa7790b5?q=80&w=2038&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        },
        {
            id: "104",
            title: "Avocado Toast",
            ingredients: ["bread", "avocado", "lemon juice", "salt", "red pepper flakes"],
            cookTime: "5 mins",
            image: "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
            id: "105",
            title: "Berry Smoothie",
            ingredients: ["strawberries", "blueberries", "yogurt", "milk", "honey"],
            cookTime: "5 mins",
            image: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        }
    ];

    if (searchTerm) {
        const searchTerms = searchTerm.toLowerCase().split(',');
        return allMockRecipes.filter(recipe => 
            searchTerms.some(term => 
                recipe.ingredients.some(ingredient => 
                    ingredient.toLowerCase().includes(term.trim())
                )
            )
        );
    }
    return allMockRecipes;
}

async function fetchRecipesByIngredients(ingredients) {
    try {
        const response = await fetch(
            `${EDAMAM_URL}?type=public&q=${ingredients}&app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}`
        );
        
        if (!response.ok) throw new Error('API request failed');
        
        const data = await response.json();
        console.log('API response:', data);
        if (!data.hits || data.hits.length === 0) {
            return getMockRecipes(ingredients);
        }
        return data.hits.map(hit => ({
            id: hit.recipe.uri.split('_')[1],
            title: hit.recipe.label,
            ingredients: hit.recipe.ingredientLines,
            cookTime: hit.recipe.totalTime ? `${hit.recipe.totalTime} mins` : "N/A",
            image: hit.recipe.image || 'https://via.placeholder.com/300x200?text=No+Image'
        }));
    } catch (error) {
        console.error('Error fetching recipes:', error);
        return getMockRecipes(ingredients);
    }
}

async function fetchRandomRecipes() {
    try {
        const response = await fetch(
            `${EDAMAM_URL}?type=public&q=chicken&app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}&random=true`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch random recipes');
        }
        
        const data = await response.json();
        if (!data.hits || data.hits.length === 0) {
            return getMockRecipes();
        }
        return data.hits.map(hit => ({
            id: hit.recipe.uri.split('#')[1],
            title: hit.recipe.label,
            ingredients: hit.recipe.ingredientLines,
            cookTime: hit.recipe.totalTime ? `${hit.recipe.totalTime} mins` : "N/A",
            image: hit.recipe.image || 'https://via.placeholder.com/300x200?text=No+Image'
        }));
    } catch (error) {
        console.error('Error fetching random recipes:', error);
        return getMockRecipes();
    }
}

function renderRecipes(recipesToRender) {
    const recipeGrid = document.querySelector('.recipe-grid');
    recipeGrid.innerHTML = '';
    
    if (apiLimitReached) {
    const limitMsg = document.createElement('div');
    limitMsg.className = 'api-limit';
    limitMsg.textContent = 'API limit reached. Showing mock data.';
    recipeGrid.appendChild(limitMsg);
    }
    if (currentSection === 'favorites' && recipesToRender.length === 0) {
        const noFavorites = document.createElement('div');
        noFavorites.className = 'no-results';
        noFavorites.textContent = 'No favorite recipes yet. Add some!';
        recipeGrid.appendChild(noFavorites);
        return;
    }
    
    if (recipesToRender.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.textContent = 'No recipes found. Try different ingredients.';
        recipeGrid.appendChild(noResults);
        return;
    }
    
    recipesToRender.forEach(recipe => {
        const isFavorite = favorites.includes(recipe.id);
        
        const recipeCard = document.createElement('div');
        recipeCard.className = 'recipe-card';
        recipeCard.innerHTML = `
            <img src="${recipe.image}" alt="${recipe.title}" class="recipe-image">
            <div class="recipe-content">
                <h3 class="recipe-title">${recipe.title}</h3>
                <p class="recipe-ingredients">${recipe.ingredients.join(', ')}</p>
                <div class="recipe-meta">
                    <span>Cook: ${recipe.cookTime}</span>
                    <button class="favorite-btn" data-id="${recipe.id}">
                        ${isFavorite ? '♥' : '♡'}
                    </button>
                </div>
            </div>
        `;
        recipeGrid.appendChild(recipeCard);
    });
    
    document.querySelectorAll('.favorite-btn').forEach(button => {
        button.addEventListener('click', toggleFavorite);
    });
}
function toggleHeroSection(show) {
    const hero = document.getElementById('hero-section');
    const categories = document.getElementById('featured-categories');
    if (hero) hero.style.display = show ? 'flex' : 'none';
    if (categories) categories.style.display = show ? 'block' : 'none';
}

function toggleFavorite(e) {
    const recipeId = e.target.getAttribute('data-id');
    const recipe = allRecipes.find(r => r.id === recipeId)|| 
                  recipes.find(r => r.id === recipeId);
    if (!recipe) {
        console.error('Recipe not found:', recipeId);
        return;
    }
    if (favorites.includes(recipeId)) {
        favorites = favorites.filter(id => id !== recipeId);
        favoriteRecipes = favoriteRecipes.filter(r => r.id !== recipeId);
        e.target.textContent = '♡';
    } else {
        favorites.push(recipeId);
        favoriteRecipes.push(recipe);
        e.target.textContent = '♥';
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    localStorage.setItem('favoriteRecipes', JSON.stringify(favoriteRecipes));
    if (currentSection === 'favorites') {
        showFavorites();
    }
}

function showLoading() {
    const recipeGrid = document.querySelector('.recipe-grid');
    recipeGrid.innerHTML = '<div class="loading">Loading recipes...</div>';
}

function showFavorites() {
    currentSection = 'favorites';
    toggleHeroSection(false);
    //const favoriteRecipes = allRecipes.filter(recipe => favorites.includes(recipe.id));
    renderRecipes(favoriteRecipes);
    updateActiveNav();
}

async function showHome(showSimilar = true) {
    currentSection = 'home';
    toggleHeroSection(true);
    showLoading();
    
    const combinedRecipes = [...allRecipes, ...favoriteRecipes];
    allRecipes = combinedRecipes.filter((recipe, index, self) =>
        index === self.findIndex(r => r.id === recipe.id)
    );
    if (allRecipes.length < 20) {
        const newRecipes = await fetchRandomRecipes();
        allRecipes = [...allRecipes, ...newRecipes].filter((recipe, index, self) =>
            index === self.findIndex(r => r.id === recipe.id)
        );
    }

    recipes = [...allRecipes];
    if (showSimilar && favorites.length > 0) {
        const favoriteRecipes = allRecipes.filter(r => favorites.includes(r.id));
        
        if (favoriteRecipes.length > 0) {
            const favoriteIngredients = new Set(
                favoriteRecipes.flatMap(r => r.ingredients)
            );
            
            const similarRecipes = allRecipes.filter(recipe => 
                !favorites.includes(recipe.id) &&
                recipe.ingredients.some(ing => favoriteIngredients.has(ing))
            );
            
            
            if (similarRecipes.length > 0) {
                
                recipes = [
                    ...similarRecipes.slice(0, 5),
                    ...allRecipes
                        .filter(r => !favorites.includes(r.id) && !similarRecipes.includes(r))
                        .sort(() => 0.5 - Math.random())
                        .slice(0, 5)
                ];
            }
        }
    } else {
        
        recipes = allRecipes
            .sort(() => 0.5 - Math.random())
            .slice(0, 10);
    }
    
    renderRecipes(recipes);
    updateActiveNav();
}

function updateActiveNav() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', 
            link.getAttribute('data-section') === currentSection);
    });
}

function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.getAttribute('data-section');
            
            switch(section) {
                case 'home':
                    showHome();
                    break;
                case 'categories':
                    
                    break;
                case 'favorites':
                    showFavorites();
                    break;
            }
        });
    });
}

document.querySelector('.search-bar input').addEventListener('input', async (e) => {
    const searchTerm = e.target.value.trim();
    
    if (searchTerm === '') {
        await showHome();
    } else {
        currentSection = 'search';
        toggleHeroSection(false);
        showLoading();
        recipes = await fetchRecipesByIngredients(searchTerm);
        allRecipes = [...recipes];
        renderRecipes(recipes);
        updateActiveNav();
    }
});


document.addEventListener('DOMContentLoaded', async () => {
    favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    favoriteRecipes = JSON.parse(localStorage.getItem('favoriteRecipes')) || [];
    
    setupNavigation();
    
    if (favorites.length > 0 && allRecipes.length === 0) {

        await showHome(true);
    } else {

        await showHome();
    }
});
let chatHistory = [];

const COHERE_API_KEY = 'JHxG7N2PbEsfpqkCrlGDsIu5yi9vaIEAqu6zoBaH'; 

async function getAIResponse(message) {
  chatHistory.push({ role: "USER", message });
  const response = await fetch('https://api.cohere.ai/v1/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${COHERE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: message,
      model: "command-r-plus",
      chat_history: chatHistory,
      temperature: 0.7,        
      max_tokens: 100  
    })
  });

  const data = await response.json();
  const botReply = data.text || "Sorry, I couldn’t understand that.";

  chatHistory.push({ role: "CHATBOT", message: botReply });

  return botReply;
}

document.querySelector('.send-btn').addEventListener('click', async () => {
  const input = document.querySelector('.chatbot-input input');
  const userMessage = input.value.trim();
  if (!userMessage) return;

  addMessage(userMessage, 'user-message');
  input.value = '';

  const botReply = await getAIResponse(userMessage);
  addMessage(botReply, 'bot-message');
});

function addMessage(text, className) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${className}`;
  msgDiv.textContent = text;
  document.querySelector('.chatbot-messages').appendChild(msgDiv);
  msgDiv.scrollIntoView({ behavior: 'smooth' });
}

document.querySelector('.chat-icon').addEventListener('click', () => {
  document.querySelector('.chatbot-container').classList.add('active');
});

document.querySelector('.close-chat').addEventListener('click', () => {
  document.querySelector('.chatbot-container').classList.remove('active');
});

document.querySelector('.chatbot-input input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.querySelector('.send-btn').click();
  }
});

document.querySelector('.close-chat').addEventListener('click', () => {
  document.querySelector('.chatbot-container').classList.remove('active');
  chatHistory = []; // Clear history on close
});
