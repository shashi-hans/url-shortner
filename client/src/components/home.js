import React, { useState } from 'react';
import '../App.css';
import axios from 'axios';

function Home() {
  const [inputUrl, setInputUrl] = useState('');

  const onChange = (e) => {
    setInputUrl(e.target.value);
  };

  const onSubmit = (e) => {
    e.preventDefault();

    axios
      .post('http://localhost:4000/api/url/shorten', { url: inputUrl }) // Pass the inputUrl value as an object
      .then((res) => {
        setInputUrl(''); // Clear the input field after successful submission
        console.log('Client response:', res.data); // Access the response data using `res.data`
        alert("Short Url = "+res.data.shortUrl)
      })
      .catch((err) => {
        console.log('Error in URL!', err);
      });
  };

  return (
    <div className='Container' id="container"> 
      <h1>URL Shortener Application</h1>
      <form onSubmit={onSubmit} className='form'>
        <div className='form-group'>
          <input
            type='text'
            placeholder='Input valid URL'
            name='title'
            className='form-control'
            value={inputUrl}
            onChange={onChange}
          />
         <button type='submit' className='btn btn-outline-warning btn-block mt-4 submit' >Shorten Url</button>
        </div>
      </form>

    </div>
  );
}

export default Home;
