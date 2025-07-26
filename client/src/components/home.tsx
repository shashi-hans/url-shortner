import React, { useState, useEffect } from "react";
import "../App.css";
import axios from "axios";
import { fullURL, baseUrl } from "../util";

const Home = () => {
  const [inputUrl, setInputUrl] = useState("");
  const [isUrlCreated, setisUrlCreated] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [copyTitle, setCopyTitle] = useState("Copy Short Url");
  const [showError, setShowError] = useState(false);
  const [visitorCount, setVisitorCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Increment visit count
    axios
      .post(`${baseUrl}/api/visitor/visit`)
      .then((res) => {
        setVisitorCount(res.data.count);
      })
      .catch(() => {
        // fallback to just get count
        axios
          .get(`${baseUrl}/api/visitor/count`)
          .then((res) => setVisitorCount(res.data.count));
      });
  }, []);

  const onChange = (e) => {
    setInputUrl(e.target.value);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    // Regular expression to match URLs
    var urlPattern =
      /^(https?:\/\/)?([\w-]+\.)*[\w-]+(\.[a-z]{2,})(:\d{1,5})?(\/\S*)?$/i;
    if (urlPattern.test(inputUrl)) {
      setLoading(true); // Show loading animation
      setShowError(false); // Hide any previous error

      axios
        .post(fullURL, { url: inputUrl }) // Pass the inputUrl value as an object
        .then((res) => {
          console.log("Client response:", res.data); // Access the response data using `res.data`
          setisUrlCreated(true);
          if (res.data._id) {
            setNewUrl(res.data.shortUrl);
          } else {
            setNewUrl(res.data);
          }
        })
        .catch((err) => {
          console.log("Error in URL!", err);
        })
        .finally(() => {
          setLoading(false); // Hide loading regardless of success or failure
        });
    } else {
      setShowError(true);
    }
  };
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(newUrl);
      setCopyTitle("Copied...");
      //make settimeout of 5sec to reset copytitle to 'Copy Short Url'
      setTimeout(() => {
        setCopyTitle("Copy Short Url");
      }, 5000);
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("Failed to copy the short URL. Please try again.");
    }
  };
  const freshUrl = () => {
    setisUrlCreated(false);
    setInputUrl(""); // Clear the input field
  };

  return (
    <div className="Container" id="container">
      <h1>URL Shortener Application</h1>
      <form onSubmit={onSubmit} className={!isUrlCreated ? "form" : "hide"}>
        <div className="form-msg">
          This is a free tool to shorten URLs and generate short links. URL
          shortener allows to create a shortened link making it easy to share.
        </div>
        <div className="form-group">
          <input
            type="text"
            placeholder="Input valid URL"
            name="title"
            className="form-control"
            value={inputUrl}
            onChange={onChange}
            onFocus={() => {
              setShowError(false);
            }}
            disabled={loading}
          />
          <button
            type="submit"
            className="btn btn-outline-warning btn-block mt-4 submit"
            disabled={loading}
          >
            {loading ? "Processing..." : "Shorten URL"}
          </button>
        </div>
      </form>
      {showError && (
        <div className="error-msg">
          Invalid URL format. Please enter a valid web address.
        </div>
      )}
      {isUrlCreated && (
        <div className="urlbox">
          <p>
            <span className="b">Short Url : </span>
            {newUrl}{" "}
          </p>
          <button onClick={copyToClipboard}> {copyTitle} </button>
          <p>
            {" "}
            <span className="b">Original Url : </span>
            {inputUrl}
          </p>
          <button onClick={freshUrl}>Shorten Another Url</button>
        </div>
      )}
      {loading && (
        <div className="overlay">
          <div className="spinner"></div>
        </div>
      )}
      <div>
        <p className='visitor'>
          Total Visitors:{" "}
          {visitorCount === 0 ? (
            <span className="overlay2">
              <span className="spinner2"></span>
            </span>
          ) : (
            visitorCount
          )}
        </p>
      </div> 
    </div>
  );
};

export default Home;
