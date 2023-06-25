import { fetchUrl, renderMarkup, clearMarkup } from './main.js';

// npm i notiflix
import { Notify } from 'notiflix/build/notiflix-notify-aio';
// const notifyWarning = {
//   width: '500px',
//   fontSize: '25px',
//   position: 'center-top',
//   opacity: 0.7,
//   timeout: 1500,
// };

Notify.init({
  width: '400px',
  fontSize: '20px',
  position: 'right-top',
  timeout: '1500',
  messageMaxLength: 150,
  distance: '20px',
  showOnlyTheLastOne: true,
  warning: {
    background: 'rgba(190, 194, 79, 1)',
    textColor: '#fff',
    childClassName: 'notiflix-notify-warning',
    notiflixIconColor: 'rgba(0,0,0,0.2)',
    fontAwesomeClassName: 'fas fa-exclamation-circle',
    fontAwesomeIconColor: 'rgba(0,0,0,1)',
    backOverlayColor: 'rgba(238,191,49,0.2)',
  },
});

// https://cssloaders.github.io/
import '../css/loader.css';

// npm install simplelightbox
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

// npm install axios
import axios from 'axios';
// const axios = require('axios/dist/node/axios.cjs');

// npm i lodash.throttle
import throttle from 'lodash.throttle';
// let throttle = require('lodash.throttle');

const API_KEY = '37780751-c0706f5026557b01bc2eaa9ec';
const API_URL = 'https://pixabay.com/api/';

const refs = {
  form: document.querySelector('.search-form'),
  gallery: document.querySelector('.gallery'),
  loadBtn: document.querySelector('.load-more'),
  loaderWait: document.querySelector('.loader'),
};

refs.form.addEventListener('submit', fetchData);
refs.loadBtn.addEventListener('click', onLoadMore);
refs.loadBtn.classList.toggle('is-hidden');
refs.loaderWait.classList.add('is-hidden');

const options = new URLSearchParams({
  key: API_KEY,
  page: 1,
  per_page: 12,
  // per_page: 40,
  q: null,
  image_type: 'photo',
  orientation: 'horizontal',
  safesearch: true,
});
let page = Number(options.get('page'));
let perPage = Number(options.get('per_page'));
let totalHits = 0;
let maxPage = 10;

async function fetchData(e) {
  try {
    e.preventDefault();
    page = Number(options.get('page'));
    let inputValue = e.currentTarget.elements.searchQuery.value.trim();

    if (inputValue === '') {
      options.set('page', `1`);
      Notify.failure('Invalid value. Input text, please.');
      return;
    }

    if (options.get('q') !== inputValue) {
      options.set('page', `1`);
      options.set('q', `${inputValue}`);
    }

    if (page > maxPage) {
      error = 'max page limit';
      maxPage = 10;
      refs.loadBtn.classList.add('is-hidden');
      throw new Error(error);
    }

    refs.loaderWait.classList.toggle('is-hidden');

    const result = await fetchUrl(`${API_URL}?${options}`);
    refs.loadBtn.classList.remove('is-hidden');
    totalHits = result.data.totalHits;

    if (totalHits < perPage) {
      refs.loadBtn.classList.add('is-hidden');
    }
    if (totalHits === 0) {
      Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
    } else {
      Notify.success(`Hooray! We found ${totalHits} images.`);
    }

    maxPage = Math.ceil(totalHits / perPage);
    clearMarkup();
    renderMarkup(result.data.hits);

    refs.loaderWait.classList.toggle('is-hidden');
    page += 1;
    options.set('page', `${page}`);

    if (totalHits < perPage) {
      refs.loadBtn.classList.add('is-hidden');
    }
    window.addEventListener(
      'scroll',
      throttle(() => {
        endlessScroll();
      }, 1000)
    );
    if (page === maxPage) {
      page = 1;
      options.set('page', `${page}`);
      window.removeEventListener(
        'scroll',
        throttle(() => {
          endlessScroll();
        }, 1000)
      );
    }
  } catch (error) {
    console.log(error);
    options.set('page', `1`);
    Notify.failure(
      'Sorry, there are no images matching your search query. Please try again.'
    );
  }
}

async function onLoadMore() {
  try {
    page = Number(options.get('page'));

    if (page > maxPage) {
      window.removeEventListener(
        'scroll',
        throttle(() => {
          endlessScroll();
        }, 600)
      );
      refs.loadBtn.classList.add('is-hidden');
      return;
    }

    refs.loadBtn.classList.add('is-hidden');
    refs.loaderWait.classList.toggle('is-hidden');

    const result = await fetchUrl(`${API_URL}?${options}`);

    renderMarkup(result.data.hits);

    refs.loadBtn.classList.remove('is-hidden');
    refs.loaderWait.classList.toggle('is-hidden');
    page += 1;
    options.set('page', `${page}`);
    return result;
  } catch (error) {
    refs.loadBtn.classList.add('is-hidden');
  }
}

async function endlessScroll() {
  let clientRect = document.documentElement.getBoundingClientRect();
  let clientHeightWindow = document.documentElement.clientHeight;

  if (clientRect.bottom < clientHeightWindow + 400) {
    onLoadMore();
  }
}

export { refs, page };
