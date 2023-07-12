/* eslint-disable */
// Updating User data as well as passwords
import axios from 'axios';
import { showAlert } from './alerts';

// data is an object {name, email}
// type is 'password' or 'data'
export const updateSettings = async (data, type) => {
  try {
    const urlEnd = type === 'data' ? 'updateMe' : 'updateMyPassword';

    const res = await axios({
      method: 'PATCH',
      url: `http://127.0.0.1:3000/api/v1/users/${urlEnd}`,
      data
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully!`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
