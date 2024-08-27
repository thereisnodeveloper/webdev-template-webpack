// #region required-template
import './reset.css';
import './style.css';

// eslint-disable-next-line no-unused-vars
const testElement = document.createElement('div');
// #endregion


// DOM elements
const domInputs = document.querySelectorAll('input');
/** @type {Array.<HTMLInputElement>} */
const [
  passwordOriginal = document.querySelector('input#password'),
  passwordToCompare = document.querySelector('input#confirm-password'),
  email = document.querySelector('input#email'),
  country = document.querySelector('#country'),
  zip = document.querySelector('#zip'),
  form = document.querySelector('form'),
] = [];
