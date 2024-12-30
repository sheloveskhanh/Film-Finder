function createForm() {
  const formContainer = document.getElementById("formContainer");

  if (!formContainer) {
    console.error("Form container not found.");
    return;
  }

  // Create form element
  const form = document.createElement("form");
  form.id = "searchForm";
  formContainer.appendChild(form); // Append the form to the formContainer

  // Create search-container div
  const searchContainer = document.createElement("div");
  searchContainer.className = "search-container";
  form.appendChild(searchContainer); // Append searchContainer to the form

  // Search input
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.id = "search";
  searchInput.placeholder = "Enter film title or keyword...";
  searchContainer.appendChild(searchInput);

  // Genre dropdown
  const genreSelect = document.createElement("select");
  genreSelect.id = "genre";
  genreSelect.innerHTML = `
        <option value="">Select Genre</option>
        <option value="Action">Action</option>
        <option value="Comedy">Comedy</option>
        <option value="Drama">Drama</option>
        <option value="Horror">Horror</option>
        <option value="Science Fiction">Science Fiction</option>
        <option value="Romance">Romance</option>
        <option value="Thriller">Thriller</option>
        <option value="Animation">Animation</option>`;
  searchContainer.appendChild(genreSelect);

  // Language dropdown
  const languageSelect = document.createElement("select");
  languageSelect.id = "language";
  languageSelect.innerHTML = `
        <option value="">Select Language</option>
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="de">German</option>
        <option value="it">Italian</option>`;
  searchContainer.appendChild(languageSelect);

  // Year input
  const yearInput = document.createElement("input");
  yearInput.type = "number";
  yearInput.id = "year";
  yearInput.placeholder = "Enter Year";
  yearInput.min = "1900";
  yearInput.max = "2024";
  searchContainer.appendChild(yearInput);

  // Sort dropdown
  const sortSelect = document.createElement("select");
  sortSelect.id = "sort";
  sortSelect.innerHTML = `
        <option value="">Sort By</option>
        <option value="popularity.desc">Popularity</option>
        <option value="release_date.desc">Release Date</option>
        <option value="vote_average.desc">Rating</option>`;
  searchContainer.appendChild(sortSelect);

  // Search button
  const searchButton = document.createElement("button");
  searchButton.textContent = "Search";
  searchButton.type = "button";
  searchButton.onclick = () => searchFilm();
  searchContainer.appendChild(searchButton);

  // Reset button
  const resetButton = document.createElement("button");
  resetButton.textContent = "Reset";
  resetButton.type = "button";
  resetButton.onclick = resetForm;
  searchContainer.appendChild(resetButton);

  // Create pagination container
  const paginationContainer = document.createElement("div");
  paginationContainer.id = "pagination";
  paginationContainer.className = "pagination-container";

  // Append paginationContainer outside the form but above the footer
  document.querySelector("main").appendChild(paginationContainer);
}

// Function to reset the form
function resetForm() {
  document.getElementById("search").value = "";
  document.getElementById("genre").value = "";
  document.getElementById("language").value = "";
  document.getElementById("year").value = "";
  document.getElementById("sort").value = "";
  document.getElementById("results").innerHTML = "";
  document.getElementById("pagination").innerHTML = "";
}

// Function to fetch films based on user input
async function searchFilm(page = 1) {
  page = Math.max(1, Math.min(500, page));

  const query = document.getElementById("search").value.trim();
  const genre = document.getElementById("genre").value;
  const language = document.getElementById("language").value;
  const year = document.getElementById("year").value;
  const sort = document.getElementById("sort").value;
  const resultsContainer = document.getElementById("results");

  resultsContainer.innerHTML = "<p>Loading films...</p>";

  try {
    const apiKey = "36b0465246018e127b54bfa7d47d965c";
    let url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&page=${page}`;

    if (query) {
      url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(
        query
      )}&page=${page}`;
    } else {
      if (genre) url += `&with_genres=${mapGenreToId(genre)}`;
      if (language) url += `&language=${language}`;
      if (year) url += `&primary_release_year=${year}`;
      if (sort) url += `&sort_by=${sort}`;
    }

    console.log("Constructed API URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error Response:", errorData);
      throw new Error(errorData.status_message || "Unknown error occurred.");
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      renderFilms(data.results);
      renderPagination(page, data.total_pages); // Render pagination buttons
    } else {
      resultsContainer.innerHTML =
        "<p>No films match your search. Try adjusting the filters or check your input.</p>";
      document.getElementById("pagination").innerHTML = ""; // Clear pagination
    }
  } catch (error) {
    console.error("Fetch error:", error);
    resultsContainer.innerHTML = `<p>Unable to fetch films. Please try again later. Error: ${error.message}</p>`;
    document.getElementById("pagination").innerHTML = ""; // Clear pagination
  }
}

async function fetchGenres() {
  const apiKey = "YOUR_API_KEY";
  const url = `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=en-US`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.genres || [];
  } catch (error) {
    console.error("Error fetching genres:", error);
    return [];
  }
}

// Function to render film cards
function renderFilms(films) {
  const resultsContainer = document.getElementById("results");
  resultsContainer.innerHTML = "";

  films.slice(0, 15).forEach((film) => {
    const filmCard = document.createElement("div");
    filmCard.className = "film";

    const img = document.createElement("img");
    img.src = `https://image.tmdb.org/t/p/w500${film.poster_path}`;
    img.alt = film.title;
    filmCard.appendChild(img);

    const details = document.createElement("div");
    details.className = "film-details";

    const title = document.createElement("h2");
    title.textContent = film.title;
    details.appendChild(title);

    const overview = document.createElement("p");
    overview.className = "overview";
    overview.textContent = film.overview;
    details.appendChild(overview);

    // Create buttons container
    const buttonsContainer = document.createElement("div");
    buttonsContainer.className = "film-buttons";

    // View Details Button
    const viewButton = document.createElement("button");
    viewButton.className = "view-details-btn";
    viewButton.textContent = "View Details";
    viewButton.onclick = () => showFilmDetails(film.id);
    buttonsContainer.appendChild(viewButton);

    // Add to Favorites Button
    const favoriteButton = document.createElement("button");
    favoriteButton.className = "favorite-btn";
    favoriteButton.innerHTML = "&#10084";
    favoriteButton.onclick = () => addToFavorites(film); // Pass the full film object
    buttonsContainer.appendChild(favoriteButton);

    details.appendChild(buttonsContainer);
    filmCard.appendChild(details);
    resultsContainer.appendChild(filmCard);
  });
}

// Function to render pagination buttons
// Function to render pagination buttons with dynamic range
function renderPagination(currentPage, totalPages) {
  const paginationContainer = document.getElementById("pagination");
  paginationContainer.innerHTML = ""; // Clear previous buttons

  const maxVisiblePages = 5; // Maximum number of pages to display
  const startPage = Math.floor((currentPage - 1) / maxVisiblePages) * maxVisiblePages + 1;
  const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

  // Create "Previous" button
  const prevButton = document.createElement("button");
  prevButton.textContent = "Previous";
  prevButton.disabled = currentPage === 1; // Disable if on the first page
  prevButton.onclick = () => searchFilm(currentPage - 1);
  paginationContainer.appendChild(prevButton);

  // Create page number buttons
  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement("button");
    pageButton.textContent = i;
    pageButton.className = i === currentPage ? "active" : ""; // Highlight the current page
    pageButton.onclick = () => searchFilm(i);
    paginationContainer.appendChild(pageButton);
  }

  // Create "Next" button
  const nextButton = document.createElement("button");
  nextButton.textContent = "Next";
  nextButton.disabled = currentPage === totalPages; // Disable if on the last page
  nextButton.onclick = () => searchFilm(currentPage + 1);
  paginationContainer.appendChild(nextButton);
}

// Function to show film details in a modal
async function showFilmDetails(filmId) {
  const modalContainer = document.getElementById("modalContainer");
  modalContainer.style.display = "block";

  const apiKey = "36b0465246018e127b54bfa7d47d965c";
  const response = await fetch(
    `https://api.themoviedb.org/3/movie/${filmId}?api_key=${apiKey}&append_to_response=credits,videos`
  );
  const film = await response.json();

  const cast = film.credits.cast
    .slice(0, 5)
    .map((actor) => actor.name)
    .join(", ");
  const genres = film.genres.map((genre) => genre.name).join(", ");

  const trailerContent =
    film.videos.results.length > 0
      ? `<iframe src="https://www.youtube.com/embed/${film.videos.results[0].key}" frameborder="0" allowfullscreen></iframe>`
      : "<p>There is no available trailer for this film.</p>";

  const modalContent = `
  <div class="modal">
    <div class="modal-header">
        <h2>${film.title}</h2>
        <span class="close-button" onclick="closeModal()">&times;</span>
    </div>
    <div class="modal-content">
        <img src="https://image.tmdb.org/t/p/w300${film.poster_path}" alt="${film.title}" />
        <div class="modal-info">
            <p><strong>Overview:</strong> ${film.overview}</p>
            <p><strong>Release Date:</strong> ${film.release_date}</p>
            <p><strong>Genres:</strong> ${genres}</p>
            <p><strong>Cast:</strong> ${cast}</p>
        </div>
    </div>
    ${trailerContent}
  </div>`;

  modalContainer.innerHTML = modalContent;
}

// Function to close the modal
function closeModal() {
  document.getElementById("modalContainer").style.display = "none";
}

// Function to add film to favorites
let favoriteFilms = []; // Array to store favorite films

// Function to handle adding films to favorites
function addToFavorites(film) {
  const filmData = {
    id: film.id,
    title: film.title,
  };

  if (!favoriteFilms.some((f) => f.id === film.id)) {
    favoriteFilms.push(filmData);
    localStorage.setItem("favorites", JSON.stringify(favoriteFilms));

  } else {
    alert(`${film.title} is already in your favorites!`);
  }
}
// Function to display favorites in a modal
function toggleFavoritesModal() {
  const modalContainer = document.getElementById("favoritesModal");
  modalContainer.style.display = "block";

  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const favoritesContent = document.getElementById("favoritesModalContent");

  if (favorites.length === 0) {
    favoritesContent.innerHTML = "<p>No favorite films added yet.</p>";
  } else {
    favoritesContent.innerHTML = `
      <h3>Here are your favorite films:</h3>
      ${favorites
        .map(
          (film) => `
          <div class="favorite-item">
            <span>${film.title}</span>
            <button class="remove-favorite-btn" onclick="removeFavorite(${film.id})">Remove</button>
          </div>
        `
        )
        .join("")}
    `;
  }
}

// Close modal on clicking outside
window.onclick = function (event) {
  const modalContainer = document.getElementById("favoritesModal");
  if (event.target === modalContainer) {
    modalContainer.style.display = "none";
  }
};

// Function to remove a film from favorites
function removeFavorite(filmId) {
  favoriteFilms = favoriteFilms.filter((film) => film.id !== filmId);
  localStorage.setItem("favorites", JSON.stringify(favoriteFilms));
  toggleFavoritesModal(); // Refresh the modal content
}

// Event listener for the favorites toggle button
const favoritesToggle = document.getElementById("favoritesToggle");
favoritesToggle.addEventListener("click", toggleFavoritesModal);

// Initialize the form
document.addEventListener("DOMContentLoaded", () => {
  createForm();
});
