$(document).ready(function () {
  // Ensure the user is logged in before showing any page
  const username = sessionStorage.getItem('username');  // Retrieve the username from session storage
  const isProfileComplete = sessionStorage.getItem('isProfileComplete');  // Check if the user has completed their profile

  if (!username) {
    // If the user is not logged in, show the login form
    showLoginForm();
  } else if (!isProfileComplete) {
    // If the user is logged in but has not completed their profile, show the profile completion form
    showProfileCompletionForm();
  } else {
    // If the user is logged in and their profile is complete, show the image feed page
    showImageFeed();
  }
});

// Hide profile details initially (they will be shown later when the user clicks on their profile)
$('#profile-details').hide();

// Handle click event on the user icon in the navigation bar
$('#nav-user-icon.online').on('click', function () {
  console.log('User icon clicked!');  
  
  // Fetch the current user's username from session storage (assuming it's already stored during login)
  const username = sessionStorage.getItem('username');
  
  if (username) {
    // If the username exists, make an AJAX request to fetch the user's profile data
    $.ajax({
      url: 'http://localhost:8080/M00942167/profile',  
      type: 'GET',  
      headers: {
        'Authorization': 'Bearer ' + sessionStorage.getItem('token') 
      },
      success: function (response) {
        // On successful response, display the profile details (username, bio, and profile picture)
        $('#profile-details').html(`
          <h2>${response.username}'s Profile</h2>
          <p>Bio: ${response.bio}</p>
          <img src="${response.profilePic}" alt="Profile Picture" />
        `).show();  
      },
      error: function () {
        // Show an error message if the AJAX request fails
        alert('Error fetching profile data.');
      }
    });
  } else {
    // If the user is not logged in, show an alert message
    alert('User not logged in.');
  }
});

// Navigation Functions

// Function to toggle between the forms (Login/Register)
function toggleForms(formToShow) {
  $('#registerForm').hide();  
  $('#loginForm').hide();  
  $(`#${formToShow}`).show();  
}

// Function to show the Register Form and hide other sections
function showRegisterForm() {
  $('#registerForm').show();  
  $('#loginForm').hide();  
  $('#imageFeed').hide();  
  $('#profileCompletionForm').hide();  
}

// Function to show the Login Form and hide other sections
function showLoginForm() {
  $('#registerForm').hide(); 
  $('#loginForm').show();  
  $('#imageFeed').hide();
  $('#profileCompletionForm').hide(); 
}

// Function to show the Image Feed and hide other sections
function showImageFeed() {
  $('#registerForm').hide();  
  $('#loginForm').hide();  
  $('#imageFeed').show();  
  $('#app').hide();  
  $('#contentImage').hide();  
  $('#profileCompletionForm').hide();  
}


// Register new user function
function register() {
  // Retrieve username and password from the registration form inputs
  const username = $('#registerUsername').val().trim();
  const password = $('#registerPassword').val().trim();

  // Make an AJAX request to register the new user
  $.ajax({
    url: 'http://localhost:8080/M00942167/users',  // The endpoint for user registration
    type: 'POST',  // HTTP method (POST)
    contentType: 'application/json',  // Set content type to JSON
    data: JSON.stringify({ username, password }),  // Send username and password in the request body as JSON
    success: function (response) {
      // On successful registration, alert the user and show the login form
      alert('Registration successful');
      showLoginForm();
    },
    error: function (xhr, status, error) {
      // If registration fails, alert the user with the error message
      alert('Error registering: ' + xhr.responseText);
    }
  });
}

// Login function
function login() {
  // Retrieve username and password from the login form inputs
  const username = $('#loginUsername').val();
  const password = $('#loginPassword').val();

  // Make an AJAX request to log in the user
  $.ajax({
    url: 'http://localhost:8080/M00942167/login', // Login endpoint
    type: 'POST',  // HTTP method (POST)
    contentType: 'application/json',  // Set content type to JSON
    data: JSON.stringify({ username, password }),  // Send username and password in the request body as JSON
    success: function (response) {
      if (response.token) {
        // If the login is successful and a token is returned, store the token and username in sessionStorage
        sessionStorage.setItem('token', response.token);
        sessionStorage.setItem('currentUser', username);

        // Alert the user and update the UI to show profile completion form
        alert('Login successful!');
        $('#loginForm').hide();  // Hide login form
        $('#registerForm').hide();  // Hide register form
        $('#contentImage').hide();  // Hide content image
        $('#imageFeed').hide();  // Hide image feed
        $('#app').hide();  // Hide main app container
        $('#profileCompletionForm').show();  // Show profile completion form
      } else {
        // If the response does not contain a token, alert the user
        alert('Unexpected response format. Please try again.');
      }
    },
    error: function (xhr) {
      // If login fails, show an error message with the error details
      const errorMsg = xhr.responseJSON?.message || xhr.responseText || 'Unknown error occurred';
      alert('Login failed: ' + errorMsg);
    }
  });
}

// Function to show the profile completion form after login
function showProfileCompletionForm() {
  // Hide other sections of the app
  $('#registerForm').hide();
  $('#loginForm').hide();
  $('#uploadForm').hide();
  $('#imageFeed').hide();
  $('#contentImage').hide();
  $('#app').hide();
  
  // Show the profile completion form
  $('#profileCompletionForm').show();
}

// Handle profile completion (submitting bio and profile picture)
function completeProfile() {
  // Retrieve username from sessionStorage (assuming user is logged in)
  const username = sessionStorage.getItem('currentUser'); 
  const bio = $('#bio').val().trim();  // Get the bio from the input field
  const profilePic = $('#profilePic')[0].files[0];  // Get the profile picture from the file input

  // Validate if all fields are filled
  if (!username || !bio || !profilePic) {
    let missingFields = [];
    if (!username) missingFields.push('username (session expired)');
    if (!bio) missingFields.push('bio');
    if (!profilePic) missingFields.push('profile picture');

    // If any field is missing, alert the user and return from the function
    alert(`Please fill in the following missing fields: ${missingFields.join(', ')}`);
    return;
  }

  // Create a FormData object to send bio and profile picture in the request
  const formData = new FormData();
  formData.append('username', username);  // Append username to the form data
  formData.append('bio', bio);  // Append bio to the form data
  formData.append('profilePic', profilePic);  // Append profile picture to the form data

  // Make an AJAX request to complete the profile
  $.ajax({
    url: 'http://localhost:8080/M00942167/complete-profile',  // Endpoint for completing the profile
    type: 'POST',  // HTTP method (POST)
    data: formData,  // Send the form data
    processData: false,  // Prevent jQuery from processing the data
    contentType: false,  // Set content type to false to allow FormData to set the correct boundary
    success: function (response) {
      // On successful profile completion, alert the user
      alert('Profile completed successfully!');
      
      // Mark the profile as complete in sessionStorage
      sessionStorage.setItem('isProfileComplete', 'true');
      sessionStorage.setItem('username', username);  // Ensure username is still stored

      // Redirect to image feed after completing profile
      showImageFeed();
    },
    error: function (xhr) {
      // If there is an error completing the profile, alert the user
      alert('Error completing profile: ' + (xhr.responseJSON?.message || xhr.responseText || 'Unknown error'));
    }
  });
}

// Event listener for clicking on the 'exploreLink' to show the explore section
$('#exploreLink').on('click', function () {
  // Hide the post image form when the user clicks on the 'explore' link
  $('#postImageForm').hide();
  
  // Hide all content sections and show the explore section
  $('.content-section').hide();  // Hide all content sections
  $('#exploreSection').show();   // Show the explore section

  // Hide the main content section
  const mainContent = document.getElementById('mainContent');
  if (mainContent) {
    mainContent.style.display = 'none';  // Set display to 'none' to hide main content
  }

  // Fetch user data from the server
  $.ajax({
    url: 'http://localhost:8080/M00942167/users',  // Endpoint to get all users
    type: 'GET',  // HTTP method (GET)
    headers: {
      'Authorization': 'Bearer ' + sessionStorage.getItem('token')  // Include token in the header if required
    },
    success: function (users) {
      const container = $('#userCardsContainer');
      container.empty();  // Clear any previous data in the container

      // Loop through the user data and append each user's card to the container
      users.forEach(user => {
        const userCard = `
          <div class="user-card">
            <img src="${user.profilePic || '../Public/Images/default-profile.jpg'}" alt="${user.username}'s Profile Picture">
            <h3>${user.username}</h3>
            <p>${user.bio || 'No bio provided'}</p>
            <button onclick="viewProfile('${user.username}')">View Profile</button>  <!-- Button to view user's profile -->
          </div>
        `;
        container.append(userCard);  // Append the user card to the container
      });
    },
    error: function (xhr) {
      // If there's an error fetching users, alert the user with the error message
      alert('Error fetching users: ' + (xhr.responseJSON?.message || xhr.responseText || 'Unknown error'));
    }
  });
});

// Function to view a user's profile when the 'View Profile' button is clicked
function viewProfile(username) {
  // Hide the main content section when viewing a profile
  $('#mainContent').hide();

  // Fetch the user's profile data from the server
  $.ajax({
    url: `http://localhost:8080/M00942167/user-profile/${username}`,  // Endpoint for fetching user profile
    type: 'GET',  // HTTP method (GET)
    headers: {
      'Authorization': 'Bearer ' + sessionStorage.getItem('token')  // Include token in the header if required
    },
    success: function (response) {
      // Create HTML to display the user's profile details
      const profileHtml = `
        <h2 class="profile-header">${response.username}'s Profile</h2>
        <img src="${response.profilePic || '../Public/Images/default-profile.jpg'}" alt="${response.username}'s Profile Picture">
        <p>Bio: ${response.bio || 'No bio available'}</p>
      `;
      // Insert the profile details into the profile section
      $('#userProfileDetails').html(profileHtml);

      // Show the user profile section and hide the other sections
      $('.content-section').hide();  // Hide all other sections
      $('#userProfileSection').show();  // Show the profile section
    },
    error: function (xhr) {
      // If there's an error fetching the profile, alert the user with the error message
      alert('Error fetching profile: ' + (xhr.responseJSON?.message || xhr.responseText || 'Unknown error'));
    }
  });
}

// Function to close the user profile section and go back to the explore section
function closeUserProfile() {
  $('#userProfileSection').hide();  // Hide the user profile section
  $('#exploreSection').show();  // Show the explore section (or home page, depending on setup)
}

let page = 1; // Track the current page for pagination
let loading = false; // Flag to prevent multiple requests

// Function to toggle follow/unfollow
function toggleFollow() {
  // Extract username from the profile details header (e.g., 'John's Profile' -> 'John')
  const username = $('#userProfileDetails h2').text().split("'s Profile")[0]; 

  // Get the current user from sessionStorage
  const currentUser = sessionStorage.getItem('currentUser'); 

  // Check if current user is logged in
  if (!currentUser) {
    alert('Current user not found. Please log in again.'); // If not logged in, alert the user
    return;
  }

  // Send an AJAX request to toggle follow/unfollow status
  $.ajax({
    url: `http://localhost:8080/M00942167/toggle-follow/${username}`,  // API endpoint to toggle follow status
    type: 'POST',  // HTTP method (POST)
    headers: {
      'Authorization': 'Bearer ' + sessionStorage.getItem('token')  // Include token in the header for authorization
    },
    contentType: 'application/json',  // Sending data as JSON
    data: JSON.stringify({ currentUser }),  // Pass the current user in the request body
    success: function (response) {
      // Update the follow button text based on the response (Follow/Unfollow)
      $('#followButton').text(response.isFollowing ? 'Follow' : 'Unfollow');
      alert(response.message); // Show a success message

      // If the user is now following, fetch their posts
      if (response.isFollowing) {
        $('#userProfilePosts').empty(); // Clear the existing posts
        page = 1; // Reset the page number for the new user's posts
        fetchUserPosts(username); // Fetch the user's posts (you would need to define this function)
      }
    },
    error: function (xhr) {
      // If there's an error, alert the user with the error message
      alert('Error updating follow status: ' + (xhr.responseJSON?.message || xhr.responseText || 'Unknown error'));
    }
  });
}

// Function to fetch contents with pagination (infinite scroll)
function fetchUserPosts(username) {
  if (loading) return; // Prevent multiple simultaneous requests (if loading is true, do nothing)

  loading = true; // Set loading flag to prevent further requests

  $('#userProfilePosts').addClass('loading'); // Show loading indicator while waiting for the response

  // AJAX request to fetch paginated contents from the server
  $.ajax({
    url: `http://localhost:8080/M00942167/contents/${username}?page=${page}&limit=5`, // Paginated endpoint with page and limit parameters
    type: 'GET', // HTTP method (GET)
    headers: {
      'Authorization': 'Bearer ' + sessionStorage.getItem('token') // Include authorization token in the request header
    },
    success: function (contents) {
      if (!contents || contents.length === 0) {
        $('#userProfilePosts').append('<p>No more contents available from this user.</p>'); // Show message when no more contents are available
        return;
      }

      // Render each content post as HTML
      const contentsHtml = contents.map(content => 
        `<div class="post-card">
          <div class="p_d">
            <div class="p_inner">
              <p class="p_name">${content.username}</p>
            </div>
          </div>
          <div class="p_image">
            <img class="pp_full" src="${content.imageUrl}" alt="Uploaded Image">
          </div>
          <div class="reaction_icon">
            <img src="../Public/Images/like.svg" alt="Like">
            <img src="../Public/Images/comment (1).svg" alt="Comment">
          </div>
          <p class="caption"><strong>${content.username}:</strong> ${content.caption || 'No caption available'}</p>
        </div>`  // HTML structure for each post, displaying the profile picture, username, image, and caption
      ).join('');  // Join all posts together into a single string

      $('#userProfilePosts').removeClass('loading'); // Hide the loading indicator
      $('#userProfilePosts').append(contentsHtml); // Add the fetched contents to the container
      page++; // Increment the page number for the next request (for pagination)
      loading = false; // Reset the loading flag
    },
    error: function (xhr) {
      alert('Error fetching contents: ' + (xhr.responseJSON?.message || xhr.responseText || 'Unknown error')); // Handle errors
      $('#userProfilePosts').removeClass('loading'); // Hide the loading indicator if an error occurs
      loading = false; // Reset the loading flag
    }
  });
}

// Infinite scroll event handler (load more content when scrolled to the bottom)
$(document).ready(function () {
  // Trigger fetch when scrolled to the bottom of the container
  $('#userProfilePosts').on('scroll', function () {
    const scrollHeight = $(this)[0].scrollHeight; // Total scrollable height
    const scrollTop = $(this).scrollTop(); // Current scroll position
    const containerHeight = $(this).height(); // Height of the container

    // If scrolled to the bottom, load more contents
    if (scrollTop + containerHeight >= scrollHeight - 5) {
      fetchUserContents($('#userProfileDetails h2').text().split("'s Profile")[0]); // Pass username dynamically to the fetch function
    }
  });
});

// Search box functionality to search users as you type
$(document).ready(function () {
  $('.search-box input').on('input', function () {
    const query = $(this).val().trim(); // Get the trimmed search query

    if (query.length > 0) {
      // If the query is not empty, send an AJAX request to search for users
      $.ajax({
        url: `http://localhost:8080/M00942167/search-users?q=${query}`, // Search endpoint with query parameter
        type: 'GET', // HTTP method (GET)
        headers: {
          'Authorization': 'Bearer ' + sessionStorage.getItem('token') // Include authorization token
        },
        success: function (users) {
          const container = $('#userCardsContainer'); // Get the container where user cards will be displayed
          container.empty(); // Clear previous search results

          if (users.length > 0) {
            // If users are found, render each user in the container
            users.forEach(user => {
              const userCard = `
                <div class="user-card">
                  <img src="${user.profilePic || '../Public/Images/default-profile.jpg'}" alt="${user.username}'s Profile Picture">
                  <h3>${user.username}</h3>
                  <p>${user.bio || 'No bio provided'}</p>
                  <button onclick="viewProfile('${user.username}')">View Profile</button>
                </div>
              `;
              container.append(userCard); // Add the user card to the container
            });
          } else {
            container.append('<p>No users found.</p>'); // If no users are found, show a message
          }
        },
        error: function (xhr) {
          alert('Error searching users: ' + (xhr.responseJSON?.message || xhr.responseText || 'Unknown error')); // Handle errors
        }
      });
    } else {
      $('#userCardsContainer').empty(); // Clear results if the query is empty
    }
  });
});

// Placeholder function to show the post image form (function is not implemented yet)
function showpostImageForm() {
  // Add logic to show the post image form when needed
}

// Function to load the current user's profile
function loadCurrentUserProfile() {
  const currentUser = sessionStorage.getItem('currentUser'); // Get the logged-in username
  if (!currentUser) {
    alert('User not logged in. Please log in again.');
    return;
  }

  // Fetch the current user's details
  $.ajax({
    url: `http://localhost:8080/M00942167/user-profile/${currentUser}`, // API call to get user profile
    type: 'GET',
    headers: {
      'Authorization': 'Bearer ' + sessionStorage.getItem('token') // Include token if needed for authentication
    },
    success: function (user) {
      console.log(user); // Check what the server returns

      // Clear the main content area
      $('#mainContent').empty();
      // Populate user profile details
      const profileHtml = `
        <div id="currentUserProfileSection">
          <img src="${user.profilePic || '../Public/Images/default-profile.jpg'}" alt="Your Profile Picture" style="max-width: 150px;"><br>
          <p><strong>Bio:</strong> ${user.bio || 'No bio provided'}</p>
          <!-- New post creation form -->
          <div id="postImageForm">
            <h3>Create a New Post</h3>
            <form id="postForm">
              <!-- Image selection input -->
              <label for="postImageFile">Select Image:</label>
              <input type="file" id="postImageFile" accept="image/*" required><br><br>
              
              <!-- Caption input -->
              <label for="postCaption">Caption:</label>
              <textarea id="postCaption" placeholder="Write a caption..." required></textarea><br><br>
              
              <!-- Post button -->
              <button type="button" onclick="uploadPost()">Post</button>
            </form>
          </div>
          <div id="postsContainer">
            <!-- Posts will be dynamically added here -->
          </div>
        </div>
      `;
      $('#mainContent').html(profileHtml); // Add the profile HTML to the main content
    },
    error: function (xhr) {
      alert('Error loading profile: ' + (xhr.responseJSON?.message || xhr.responseText || 'Unknown error'));
    }
  });
}

// Event listener for the "Home" link to toggle sections on the page
document.querySelector('a[title="Home"]').addEventListener('click', function(event) {
  event.preventDefault(); // Prevent default anchor behavior (navigation)

  // Hide all sections
  document.querySelectorAll('.content-section').forEach(section => {
    section.style.display = 'none';
  });

  const mainContent = document.getElementById('mainContent');
  mainContent.style.display = 'none';

  // Hide the userProfileSection
  const userProfileSection = document.getElementById('userProfileSection');
  if (userProfileSection) {
    userProfileSection.style.display = 'none';
  }

  // Show the home section
  const homeSection = document.getElementById('homeSection');
  if (homeSection) {
    homeSection.style.display = 'block';
  } else {
    console.error('Home section not found!');
  }
});

// Function to handle post uploads
function uploadPost() {
  const imageInput = document.getElementById('postImageFile');
  const captionInput = document.getElementById('postCaption');

  // Get the JWT token from sessionStorage
  const token = sessionStorage.getItem('token');

  if (!token) {
    alert('You need to log in to post.');
    return;
  }

  if (!imageInput.files.length) {
    alert('Please select an image to upload.');
    return;
  }
  if (!captionInput.value.trim()) {
    alert('Please enter a caption.');
    return;
  }

  const file = imageInput.files[0];
  const formData = new FormData();
  formData.append('image', file);
  formData.append('caption', captionInput.value);

  fetch('/M00942167/contents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  })
    .then(response => response.json())
    .then(data => {
      if (data.message === 'Post created successfully') {
        // Display a success message to the user
        alert('Your post has been uploaded successfully!');
      } else {
        alert(data.message);
      }
    })
    .catch(error => console.error('Error creating content:', error));

  // Reset the form after submission
  document.getElementById('postForm').reset();
}

// Infinite scroll logic
let currentPage = 1; // Start from page 1
const limit = 3; // Number of posts per page
const postsContainer = document.getElementById('postsContainer');
let isLoading = false; // To prevent multiple simultaneous requests

// Function to retrieve the current user's username dynamically
function getCurrentUsername() {
  const username = sessionStorage.getItem('currentUser');
  if (username) {
    return username;
  } else {
    alert('User is not logged in. Please log in first.');
    // Redirect to login page or handle as necessary
    return null;
  }
}

// Fetch the current user
const username = getCurrentUsername();
if (!username) {
  console.error('Cannot fetch contents because username is not available.');
}

// Function to fetch and display posts from the server
function fetchContents(page) {
  // Prevent multiple simultaneous requests or exit if username is missing
  if (isLoading || !username) return; 
  isLoading = true; // Set loading to true to prevent multiple fetch requests

  // Fetch the contents from the server using the provided username, page, and limit
  fetch(`/M00942167/contents/${username}?page=${page}&limit=${limit}`)
    .then(response => response.json()) // Parse the JSON response
    .then(contents => {
      isLoading = false; // Set loading to false once the content is fetched

      // If no content is returned (i.e., the end of the feed), display a message
      if (contents.length === 0) {
        document.getElementById('endOfFeed').innerText = "No more contents to display."; // Display 'No more contents'
        return; // Exit the function if there are no more contents
      }

      // Loop through the contents array and create HTML for each post
      contents.forEach(content => {
        const contentElement = document.createElement('div'); // Create a new div for each post
        contentElement.classList.add('post-card'); // Add a class for styling the post

        // Set the inner HTML of the post card
        contentElement.innerHTML = `
          <div class="post-header">
            <div class="post-user"> 
              <p class="username">${content.username}</p> <!-- Display the username -->
            </div>
          </div>
          <div class="post-image">
            <!-- Display the uploaded image -->
            <img class="post-img" src="${content.imageUrl}" alt="Uploaded Image">
          </div>
          <div class="post-caption">
            <p><strong>${content.username}:</strong> ${content.caption || 'No caption available'}</p> <!-- Display the caption -->
          </div>
        `;

        // Append the created content element to the posts container
        postsContainer.appendChild(contentElement); 
      });
    })
    .catch(error => {
      isLoading = false; // Reset loading state on error
      console.error('Error fetching contents:', error); // Log the error
    });
}

// Infinite scroll event to load more content when the user scrolls to the bottom
window.addEventListener('scroll', () => {
  // Check if the user has scrolled to the bottom of the page
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 50 && !isLoading) {
    currentPage++; // Increment the page number
    fetchContents(currentPage); // Fetch the next page of contents
  }
});

// Initial load of contents if the username exists
if (username) {
  fetchContents(currentPage); // Load the first page of content
}


// Function to unfollow a user
function unfollowUser(username) {
  // Get current user from session storage
  const currentUser = sessionStorage.getItem('currentUser'); 

  // Check if the current user is available
  if (!currentUser) {
    alert('Current user not found. Please log in again.'); // Alert if the user is not found
    return; // Exit the function if no user is logged in
  }

  // Make an AJAX request to the server to unfollow the user
  $.ajax({
    // URL to the API endpoint for unfollowing a user
    url: `http://localhost:8080/M00942167/follow/${username}`, // Use the correct endpoint
    
    // Set the request type to DELETE (removing a follow)
    type: 'DELETE',
    
    // Set the Authorization header to pass the token if required
    headers: {
      'Authorization': 'Bearer ' + sessionStorage.getItem('token') // Optional: Include auth token
    },

    // Specify the content type and send the current user in the request body
    contentType: 'application/json',
    data: JSON.stringify({ currentUser }), // Send the current user in the body

    // If the request is successful, handle the response
    success: function (response) {
      alert(response.message); // Display the confirmation message from the server
      // Optionally, update the UI to reflect the unfollow action
      $('#followButton').text('Follow'); // Change button text to 'Follow'
    },

    // If the request fails, handle the error
    error: function (xhr) {
      // Display an error message with details from the server or generic message
      alert('Error unfollowing user: ' + (xhr.responseJSON?.message || xhr.responseText || 'Unknown error'));
    }
  });
}










