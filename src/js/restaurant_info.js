const restAPI = require('./rest_api');
let restaurantRequest;

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
async function fillRestaurantHoursHTML () {
  const operatingHours = (await restaurantRequest).operating_hours;
  const hours = document.getElementById('restaurant-hours');

  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create single review HTML and return it.
 */
function createReviewHTML(review) {
  const li = document.createElement('li');
  li.className = 'review';

  const article = document.createElement('article');
  li.appendChild(article);

  const name = document.createElement('span');
  name.className = 'username';
  name.innerHTML = review.name;
  article.appendChild(name);

  const rating = document.createElement('span');
  rating.className = 'rating';
  rating.role = 'img';
  // For some reason VoiceOver skips the "rating" element, a quick search revealed that it might be a bug with SVG,
  // Anyways, adding a 'role' of 'img' to the span turns out to be a nice solution.
  rating.setAttribute('role', 'img');
  rating.setAttribute('aria-label', `Rated ${review.rating} out of 5`);

  // Add Star SVG for each rating point.
  for(let i = 0; i < 5; i++) {
    const star = '<svg width="14" viewBox="0 0 576 512"><path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"></path></svg>';
    const emptyStar = '<svg width="14" viewBox="0 0 576 512"><path fill="#c9c9c9" d="M528.1 171.5L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6zM388.6 312.3l23.7 138.4L288 385.4l-124.3 65.3 23.7-138.4-100.6-98 139-20.2 62.2-126 62.2 126 139 20.2-100.6 98z"></path></svg>';
    // If the index is smaller than the rating, then add a full star, else add an empty one(this loop runs up to 5)
    rating.innerHTML += (i < review.rating) ? star : emptyStar;
  }
  article.appendChild(rating);

  const date = document.createElement('span');
  date.className = 'date';
  date.innerHTML = review.date;
  article.appendChild(date);

  const comments = document.createElement('p');
  comments.className = 'body';
  comments.innerHTML = review.comments;
  article.appendChild(comments);

  return li;
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
async function fillReviewsHTML() {
  const reviews = (await restaurantRequest).reviews;
  const container = document.querySelector('#reviews-container .width-limiter');

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create restaurant HTML and add it to the webpage
 */
async function fillRestaurantHTML() {
  let restaurant = await restaurantRequest;

  const name = document.getElementById('restaurant-name');
  name.innerHTML = await restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  // Create responsive and accessible image element
  const image = document.getElementById('restaurant-img');
  const imgUrl = restAPI.imageUrlForRestaurant(restaurant);

  // True when there is no image.
  if(imgUrl === '/img/undefined.jpg') {
    image.src = '/style/no_photo.svg';

  // Else when there is an image.
  } else {
    const largeImage = imgUrl.replace('.', '_large.');
    const mediumImage = imgUrl.replace('.', '_medium.');
    image.src = imgUrl;
    image.srcset = `${imgUrl} 800w, ${largeImage} 650w, ${mediumImage} 360w`;
    image.sizes = '(min-width: 1460px) 650px, (min-width: 1024px) calc(50vw - 80px), (min-width: 725px) 650px, calc(100vw - 60px)';
  }
  image.alt = restaurant.name;
  image.setAttribute('aria-hidden', 'true');

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  await fillReviewsHTML();
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
async function fillBreadcrumb() {
  let restaurant = await restaurantRequest;

  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Get current restaurant from page URL.
 */
async function fetchRestaurantFromURL() {
  if (restaurantRequest) return restaurantRequest;

  const id = getParameterByName('id');

  // no id found in URL
  if (!id) {
    console.error('No restaurant id in URL');
    return;
  }

  try {
    restaurantRequest = restAPI.fetchRestaurantById(id);
  } catch(error) {
    console.error(error);
  }
    
  await fillRestaurantHTML();
  await fillBreadcrumb();
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  restaurantRequest.then(restaurant => {
    self.map = new google.maps.Map(document.getElementById('map'), {
      zoom: 16,
      center: restaurant.latlng,
      scrollwheel: false,
      disableDefaultUI: true
    });
    restAPI.mapMarkerForRestaurant(restaurant, self.map);

  }).catch(error => {
    console.error(error);
  });
};

fetchRestaurantFromURL().catch(error => console.error(error));