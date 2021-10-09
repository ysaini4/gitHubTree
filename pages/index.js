import Head from "next/head";
import { useEffect, useState, useReducer } from "react";
const axios = require("axios");
import { GitHubApiUrl, GithubToken } from "../config"
export default function Home() {
  let defaultText = 'Select a PR to load file...'
  const [fileData, setFileData] = useState({data:defaultText});
  const [repos, dispatch] = useReducer((repos, action) => {
    switch (action.type) {
      case 'putRepos':
        return action.repos;
      case 'updateRepo':
        return repos.map(repo => repo.id === action.repo.id ? action.repo : repo);
      default:
        throw new Error();
    }
  }, []);
  useEffect(() => {
    axios
      .get(`${GitHubApiUrl}/repositories`, {
        headers: {
          'Authorization': GithubToken
        }
      })
      .then(function ({data}) {
        let repos = data.map(({id, name, url}) => ({id, name, url}));
        dispatch({type: 'putRepos',repos})
      })
      .catch(function (error) {
        console.log(error);
      });
  }, []);
  function getPRs(repo) {
    axios
      .get(`${repo.url}/pulls`,{
        headers: {
          'Authorization': GithubToken
        }
      })
      .then(function ({data}) {
        repo.prs = data.map(({id, number, title}) => ({id, number, title}));
        dispatch({type: 'updateRepo',repo})
      });
  }
  
  function getFiles(repo, pr) {
    axios
      .get(`${repo.url}/pulls/${pr.number}/files`,{
        headers: {
          'Authorization': GithubToken
        }
      })
      .then(function ({data}) {
        repo.prs = repo.prs.map(prIn => {
        if(prIn.id === pr.id) {
          prIn.files = data.map(({filename, contents_url}) => ({filename, contents_url}))
        }
        return prIn  
        })
        dispatch({type: 'updateRepo',repo})
      });
  }
  function getFile(file,prId){
    axios
      .get(file.contents_url, {
        headers: {
          'Authorization': GithubToken,
          'Accept': 'application/vnd.github.VERSION.raw'
         
        }
      })
      .then(function ({data}) {
        setFileData({filename: `${prId}${file.filename}`, data})
      });
  }
  return (
    <div className="container">
      <Head>
        <title>GitHub Tree Mockup</title>
        <link rel="icon" href="/" />
      </Head>
      <main>
        <h1 className="title">
           GitHub Tree Mockup
        </h1>
        <div className="">
          <div className="repo-tree">
            <ul>
            {repos.map((repo) => {
              return (
                <div className="card" key={repo.id}>
                    <li >
                    <a onClick={() =>  getPRs(repo)}>{repo.name}</a>
                    {repo.prs && repo.prs.length ? (
                    <ul>
                      {repo.prs.map(pr => {
                        return (
                          <li key={pr.id}>
                            <a onClick={() => getFiles(repo,pr)}>PR: {pr.title}</a>
                            {pr.files && pr.files.length ? (
                              <ul>
                              {pr.files.map(file => {
                                return <li key={file.filename} className={fileData.filename ===  `${pr.id}${file.filename}` ? "selected" : ''}>
                                  <a onClick={() => getFile(file, pr.id)}>File: {file.filename}</a>
                                </li>
                              })}
                            </ul>
                            ) : ''}
                          </li>
                        )
                      })}
                    </ul>
                    ) : ''}
                    </li> 
                </div>
              );
            })}
            </ul>
          </div>
          <div className="file-content">
            <div>
            <button onClick={() => setFileData({data:defaultText})}>Clear</button>
              </div>
              <textarea value={fileData.data} readOnly > 
              </textarea>
          </div>
        </div>
      </main>
      <style jsx>{`
      .repo-tree {
        width:34%;
        float:left;
        padding-right:5px;
      }
      .file-content {
        width:65%;
        float:left;
      }
      textarea {
        width:63%;
        position:fixed;
        height:530px;
        resize:none;
        padding-left:15px;
      }
      a {
        cursor:pointer
      }
      a:hover {
        color:gray;
      }
      .selected {
        background: black;
        color: white;
        border-radius: 5px;
        padding: 3px;
      }
      ul {
        padding-left: 23px;
      }
      button {
        position:fixed;
        top:50px;
      }
       `}</style>
    </div>
  );
}
