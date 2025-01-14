// Cached data
let cachedGenres = null;
let cachedLanguages = null;
let favoriteFilms = [];

// Helper function: Construct API URL
function constructApiUrl(endpoint, params = {}) {
    const apiKey = "36b0465246018e127b54bfa7d47d965c";
    const baseUrl = "https://api.themoviedb.org/3";
    const url = new URL(`${baseUrl}/${endpoint}`);

    // Add the API key and other query parameters
    url.searchParams.append("api_key", apiKey);
    Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
    });

    return url.toString();
}

// Generalized API fetch function
async function handleApiRequest(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`Network error: ${response.status} - ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("API Request Error:", error);

        // Explicitly show the network error
        displayNetworkError("Failed to fetch data. Please check your connection and try again.");
        
        // Re-throw the error if needed for further handling
        throw error;
    }
}


async function fetchFromAPI(endpoint, params = {}) {
    const url = constructApiUrl(endpoint, params);
    return await handleApiRequest(url);
}

// Function to display network error
function displayNetworkError(message) {
    const errorContainer = document.getElementById("errorContainer");

    if (!errorContainer) {
        const errorDiv = document.createElement("div");
        errorDiv.id = "errorContainer";
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Function to save form data to localStorage
function saveFormData() {
    const formData = {
        search: document.getElementById("search").value,
        genre: document.getElementById("genre").value,
        language: document.getElementById("language").value,
        year: document.getElementById("year").value,
        sort: document.getElementById("sort").value,
    };
    localStorage.setItem("formData", JSON.stringify(formData));
}

// Function to create the form
async function createForm() {
    const formContainer = document.getElementById("formContainer");
    if (!formContainer) {
        console.error("Form container not found.");
        return;
    }

    const form = document.createElement("form");
    form.id = "searchForm";
    formContainer.appendChild(form);

    const searchContainer = document.createElement("div");
    searchContainer.className = "search-container";
    form.appendChild(searchContainer);

    // Load saved data from localStorage
    const savedData = JSON.parse(localStorage.getItem("formData")) || {};

    // Search input
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.id = "search";
    searchInput.name = "search";
    searchInput.placeholder = "Enter film title or keyword...";
    searchInput.value = savedData.search || ""; // Load saved value
    searchInput.oninput = () => {
        searchInput.value = searchInput.value.replace(/[^a-zA-Z0-9\s]/g, ""); // Remove invalid characters
        saveFormData();
    };
    searchContainer.appendChild(searchInput);

    // Genre dropdown
    const genreSelect = document.createElement("select");
    genreSelect.id = "genre";
    genreSelect.name = "genre";
    genreSelect.innerHTML = `<option value="">Loading genres...</option>`;
    searchContainer.appendChild(genreSelect);
    await populateGenres(genreSelect);
    genreSelect.value = savedData.genre || ""; // Load saved value
    genreSelect.onchange = saveFormData;

    // Language dropdown
    const languageSelect = document.createElement("select");
    languageSelect.id = "language";
    languageSelect.name = "language";
    languageSelect.innerHTML = `<option value="">Loading languages...</option>`;
    searchContainer.appendChild(languageSelect);
    await populateLanguages(languageSelect);
    languageSelect.value = savedData.language || ""; // Load saved value
    languageSelect.onchange = saveFormData;

    // Year input
    const yearInput = document.createElement("input");
    yearInput.type = "number";
    yearInput.id = "year";
    yearInput.name = "year";
    yearInput.placeholder = "Enter Year";
    yearInput.min = "1900";
    yearInput.max = new Date().getFullYear().toString();
    yearInput.value = savedData.year || ""; // Load saved value
    yearInput.oninput = saveFormData;
    searchContainer.appendChild(yearInput);

    // Sort dropdown
    const sortSelect = document.createElement("select");
    sortSelect.id = "sort";
    sortSelect.name = "sort";
    sortSelect.innerHTML = `
        <option value="">Sort By</option>
        <option value="popularity.desc">Popularity</option>
        <option value="release_date.desc">Release Date</option>
        <option value="vote_average.desc">Rating</option>`;
    sortSelect.value = savedData.sort || ""; // Load saved value
    sortSelect.onchange = saveFormData;
    searchContainer.appendChild(sortSelect);

    // Search button
    const searchButton = document.createElement("button");
    searchButton.textContent = "Search";
    searchButton.type = "submit";
    searchContainer.appendChild(searchButton);

    // Reset button
    const resetButton = document.createElement("button");
    resetButton.textContent = "Reset";
    resetButton.type = "reset";
    resetButton.onclick = () => {
        localStorage.removeItem("formData"); // Clear saved data
        resetForm();
    };
    searchContainer.appendChild(resetButton);

    form.onsubmit = async (event) => {
        event.preventDefault();
        searchFilm();
    };
}

// Function to populate genres
async function populateGenres(genreSelect) {
    const genres = await getGenres();
    genreSelect.innerHTML = `<option value="">Select Genre</option>`;
    genres.forEach((genre) => {
        const option = document.createElement("option");
        option.value = genre.id;
        option.textContent = genre.name;
        genreSelect.appendChild(option);
    });
}

// Function to populate languages
async function populateLanguages(languageSelect) {
    const languages = await getLanguages();
    languageSelect.innerHTML = `<option value="">Select Language</option>`;
    languages.forEach((lang) => {
        const option = document.createElement("option");
        option.value = lang.iso_639_1;
        option.textContent = lang.english_name;
        languageSelect.appendChild(option);
    });
}

// Function to fetch genres
async function getGenres() {
    if (cachedGenres) return cachedGenres;
    const data = await fetchFromAPI("genre/movie/list", { language: "en-US" });
    cachedGenres = data.genres;
    return cachedGenres;
}

// Function to fetch languages
async function getLanguages() {
    if (cachedLanguages) return cachedLanguages;
    const data = await fetchFromAPI("configuration/languages");
    cachedLanguages = data;
    return cachedLanguages;
}

// Function to reset the form
function resetForm() {
    document.getElementById("searchForm").reset();
    document.getElementById("results").innerHTML = "";
    document.getElementById("pagination").innerHTML = "";
}

// Function to search films
async function searchFilm(page = 1) {
    page = Math.max(1, Math.min(500, page));
    const query = document.getElementById("search").value.trim();
    const genre = document.getElementById("genre").value;
    const language = document.getElementById("language").value;
    const year = document.getElementById("year").value;
    const sort = document.getElementById("sort").value;

    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "<p>Loading films...</p>";

    const params = {
        query: query || undefined,
        page,
        with_genres: genre || undefined,
        language: language || undefined,
        primary_release_year: year || undefined,
        sort_by: sort || undefined,
    };

    const endpoint = query ? "search/movie" : "discover/movie";

    try {
        const data = await fetchFromAPI(endpoint, params);

        if (data.results && data.results.length > 0) {
            renderFilms(data.results);
            renderPagination(page, data.total_pages);
        } else {
            resultsContainer.innerHTML =
                "<p>No films match your search. Try adjusting the filters or check your input.</p>";
            document.getElementById("pagination").innerHTML = "";
        }
    } catch (error) {
        console.error("Fetch error:", error);
        resultsContainer.innerHTML = `<p>Unable to fetch films. Please try again later. Error: ${error.message}</p>`;
    }
}

// Function to render films
function renderFilms(films) {
  const resultsContainer = document.getElementById("results");
  resultsContainer.innerHTML = ""; // Clear previous results

  films.forEach((film) => {
      const filmCard = document.createElement("div");
      filmCard.className = "film";

      // Film Poster
      const img = document.createElement("img");
      img.src = film.poster_path
          ? `https://image.tmdb.org/t/p/w500${film.poster_path}`
          : "https://via.placeholder.com/500x750?text=No+Image";
      img.alt = film.title || "Film Poster";
      filmCard.appendChild(img);

      // Film Title
      const title = document.createElement("h2");
      title.textContent = film.title || "Untitled";
      filmCard.appendChild(title);

      // Buttons Container
      const buttonsContainer = document.createElement("div");
      buttonsContainer.className = "film-buttons";

      // View Details Button
      const detailsButton = document.createElement("button");
      detailsButton.textContent = "View Details";
      detailsButton.className = "view-details-btn";
      detailsButton.onclick = () => showFilmDetails(film.id);
      buttonsContainer.appendChild(detailsButton);

      // Add to Favorite Button
      const favoriteButton = document.createElement("button");
      favoriteButton.textContent = "Add to Favorite";
      favoriteButton.className = "add-to-favorite-btn";
      favoriteButton.onclick = () => addToFavorites(film); // Save film to favorites
      buttonsContainer.appendChild(favoriteButton);

      // Append Buttons Container to Film Card
      filmCard.appendChild(buttonsContainer);

      // Append Film Card to Results
      resultsContainer.appendChild(filmCard);

  });
}

// Function to render pagination
function renderPagination(currentPage, totalPages) {
    const paginationContainer = document.getElementById("pagination");
    paginationContainer.innerHTML = "";

    // Create previous button
    if (currentPage > 1) {
        const prevButton = document.createElement("button");
        prevButton.textContent = "Previous";
        prevButton.onclick = () => searchFilm(currentPage - 1);
        paginationContainer.appendChild(prevButton);
    }

    // Create next button
    if (currentPage < totalPages) {
        const nextButton = document.createElement("button");
        nextButton.textContent = "Next";
        nextButton.onclick = () => searchFilm(currentPage + 1);
        paginationContainer.appendChild(nextButton);
    }
}

// Function to show film details
async function showFilmDetails(filmId) {
    const modalContainer = document.getElementById("modalContainer");
    modalContainer.style.display = "block"; // Show the modal

    try {
        const data = await fetchFromAPI(`movie/${filmId}`, {
            append_to_response: "credits,videos",
        });

        // Get film details
        const { title, overview, release_date, genres, credits, videos, poster_path } = data;

        const cast = credits.cast.slice(0, 5).map((actor) => actor.name).join(", ");
        const genreList = genres.map((genre) => genre.name).join(", ");
        const trailer = videos.results.find((video) => video.type === "Trailer");

        // Modal Content
        const modalContent = `
            <div class="modal">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <span class="close-button" onclick="closeModal()">&times;</span>
                </div>
                <div class="modal-content">
                    <img src="${
                        poster_path
                            ? `https://image.tmdb.org/t/p/w500${poster_path}`
                            : "https://via.placeholder.com/500x750?text=No+Image"
                    }" alt="${title}" />
                    <div class="modal-info">
                        <p><strong>Overview:</strong> ${overview || "No overview available."}</p>
                        <p><strong>Release Date:</strong> ${release_date || "Unknown"}</p>
                        <p><strong>Genres:</strong> ${genreList || "N/A"}</p>
                        <p><strong>Cast:</strong> ${cast || "N/A"}</p>
                    </div>
                </div>
                ${
                    trailer
                        ? `<iframe src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen></iframe>`
                        : "<p>No trailer available.</p>"
                }
            </div>
        `;

        modalContainer.innerHTML = modalContent;
    } catch (error) {
        console.error("Error fetching film details:", error);
        modalContainer.innerHTML = `<p>Unable to fetch film details. Please try again later.</p>`;
    }
}

// Close modal function
function closeModal() {
    const modalContainer = document.getElementById("modalContainer");
    modalContainer.style.display = "none";
    modalContainer.innerHTML = ""; // Clear content
}

// Close Modal on Outside Click
document.getElementById("favoritesModal").addEventListener("click", (event) => {
    const modalContent = document.querySelector(".favorites-modal-content");
    if (event.target === modalContent || modalContent.contains(event.target)) {
        return; // Ignore clicks inside the modal content
    }
    closeFavoritesModal(); // Close the modal on outside click
});

// Display Favorites Modal
function displayFavorites() {
    const favoritesModal = document.getElementById("favoritesModal");
    const favoritesModalContent = document.getElementById("favoritesModalContent");
    favoritesModalContent.innerHTML = ""; // Clear previous content

    const favoriteFilms = JSON.parse(localStorage.getItem("favorites")) || [];

    if (favoriteFilms.length === 0) {
        favoritesModalContent.innerHTML = "<p>No favorite films added yet.</p>";
    } else {
        favoriteFilms.forEach((film) => {
            const favoriteItem = document.createElement("div");
            favoriteItem.className = "favorite-item";

            const title = document.createElement("span");
            title.textContent = film.title;
            favoriteItem.appendChild(title);

            // Add a "Remove" button
            const removeButton = document.createElement("button");
            removeButton.textContent = "Remove";
            removeButton.className = "remove-favorite-btn";
            removeButton.onclick = () => {
                removeFavorite(film.id);
                displayFavorites(); // Refresh the list
            };
            favoriteItem.appendChild(removeButton);

            favoritesModalContent.appendChild(favoriteItem);
        });
    }

    favoritesModal.style.display = "block"; // Show the modal
}

function closeFavoritesModal() {
    const favoritesModal = document.getElementById("favoritesModal");
    favoritesModal.style.display = "none"; // Hide the modal
}

function addToFavorites(film) {
    const favoriteFilms = JSON.parse(localStorage.getItem("favorites")) || [];

    // Check if the film is already in favorites
    if (favoriteFilms.some((f) => f.id === film.id)) {
        alert(`${film.title} is already in your favorites!`);
        return;
    }

    // Add film to favorites
    favoriteFilms.push({
        id: film.id,
        title: film.title,
        poster_path: film.poster_path,
    });

    // Save updated favorites to localStorage
    localStorage.setItem("favorites", JSON.stringify(favoriteFilms));
    alert(`${film.title} has been added to your favorites!`);
}

function removeFavorite(filmId) {
    let favoriteFilms = JSON.parse(localStorage.getItem("favorites")) || [];
    favoriteFilms = favoriteFilms.filter((film) => film.id !== filmId);

    // Update localStorage with the new list
    localStorage.setItem("favorites", JSON.stringify(favoriteFilms));

    // Refresh the favorites list
    displayFavorites();

    alert("Film removed from favorites!");
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
    createForm();
    document.getElementById("favoritesToggle").addEventListener("click", displayFavorites);
});

document.getElementById("modalContainer").addEventListener("click", (event) => {
    const modalContent = document.querySelector(".modal-content");
    if (!modalContent.contains(event.target)) {
        closeModal(); // Close the film detail modal
    }
});
