import React, { useState, useEffect, useRef } from "react";
import "../App.css";
import axios from "axios";
import { fullURL, baseUrl } from "../util";

const isParseableUrl = (value) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const Home = () => {
  const [inputUrl, setInputUrl] = useState("");
  const [isUrlCreated, setisUrlCreated] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [copyTitle, setCopyTitle] = useState("Copy Short Url");
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [visitorCount, setVisitorCount] = useState(null);
  const [loading, setLoading] = useState(false);
  // React StrictMode runs effects twice in development; count each page load once
  const visitCounted = useRef(false);
  const copyTimer = useRef(null);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  useEffect(() => {
    if (visitCounted.current) return;
    visitCounted.current = true;
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
          .then((res) => setVisitorCount(res.data.count))
          .catch(() => setVisitorCount("-"));
      });
  }, []);

  const onChange = (e) => {
    setInputUrl(e.target.value);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const trimmedUrl = inputUrl.trim();
    // The server accepts only absolute http(s) URLs, so add a scheme when the user typed "example.com".
    // The server does the full validation; this check only catches empty or unparseable input early.
    const fullInputUrl = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
    if (trimmedUrl && !/\s/.test(trimmedUrl) && isParseableUrl(fullInputUrl)) {
      setInputUrl(fullInputUrl);
      setLoading(true); // Show loading animation
      setShowError(false); // Hide any previous error

      axios
        .post(fullURL, { url: fullInputUrl })
        .then((res) => {
          setisUrlCreated(true);
          setNewUrl(res.data.shortUrl);
        })
        .catch((err) => {
          console.error("Error in URL!", err);
          setErrorMsg(err.response?.data?.error || "Could not shorten the URL. Please try again.");
          setShowError(true);
        })
        .finally(() => {
          setLoading(false); // Hide loading regardless of success or failure
        });
    } else {
      setErrorMsg("Invalid URL format. Please enter a valid web address.");
      setShowError(true);
    }
  };
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(newUrl);
      setCopyTitle("Copied...");
      // Reset the button label after 5 seconds
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => {
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
          {errorMsg}
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
          {visitorCount === null ? (
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
