/* eslint-disable */
// Index file is to get data from userInterface and delegate actions
import '@babel/polyfill';
import { login, logout } from './login';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');

// DELEGATION
if (mapBox) {
  const locations = JSON.parse(
    document.getElementById('map').dataset.locations
  );
}

if (loginForm) {
  document.querySelector('.form').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logOutBtn) logOutBtn.addEventListener('click', logout);
