import React, { useState } from 'react';
import '../App.css';
import axios from 'axios';
import { fullURL }  from '../util';

const Home = () => {
  const [inputUrl, setInputUrl] = useState('');
  const [isUrlCreated, setisUrlCreated] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [copyTitle, setCopyTitle] = useState('Copy Short Url')
  const [showError, setShowError] = useState(false);
  const onChange = (e) => {
    setInputUrl(e.target.value);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    // Regular expression to match URLs
    var urlPattern = /^(https?:\/\/)?([\w-]+\.)*[\w-]+(\.[a-z]{2,})(:\d{1,5})?(\/\S*)?$/i;
    if (urlPattern.test(inputUrl)) {
      axios
        .post(fullURL, { url: inputUrl }) // Pass the inputUrl value as an object
        .then((res) => {
          console.log('Client response:', res.data); // Access the response data using `res.data`
          setisUrlCreated(true)
          if(res.data._id) {setNewUrl(res.data.shortUrl)}
          else {setNewUrl(res.data)}
        })
        .catch((err) => {
          console.log('Error in URL!', err);
        });
      } else {
        setShowError(true)
        };

    }
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(newUrl);
      setCopyTitle('Copied...')
      //make settimeout of 5sec to reset copytitle to 'Copy Short Url'
      setTimeout(()=>{setCopyTitle('Copy Short Url')},5000)
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy the short URL. Please try again.');
    }
  };
  const freshUrl = () => {
    setisUrlCreated(false)
    setInputUrl('') // Clear the input field
  }

  return (
    <div className='Container' id="container"> 
      <h1>URL Shortener Application</h1>
      <form onSubmit={onSubmit} className={!isUrlCreated ? 'form' : 'hide'} >
        <div className='form-msg'>This is a free tool to shorten URLs and generate short links. URL shortener allows to create a shortened link making it easy to share.</div>
        <div className='form-group'>
          <input
            type='text'
            placeholder='Input valid URL'
            name='title'
            className='form-control'
            value={inputUrl}
            onChange={onChange}
            onFocus={()=>{setShowError(false)}}
          />
         <button type='submit' className='btn btn-outline-warning btn-block mt-4 submit' >Shorten Url</button>
        </div>
      </form>
      {showError && 
        <div className='error-msg'> 
          Invalid Url Format
        </div>
      }
      {isUrlCreated &&
      <div className="urlbox">
        <div className='short-url-box'>
          <p ><b>Short Url : </b>{newUrl} </p>
          <button onClick={copyToClipboard}> {copyTitle} </button>
        </div>
        <p> <b>Original Url : </b>{inputUrl}</p>
        <button onClick={freshUrl}>Shorten Another Url</button>
      </div>
      }
    </div>
  );
}

export default Home;
