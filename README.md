# Large bulk upload

The project aim to solve the issue of sending huge files or sending lot of files at the same time,
and thus by providing an uploader component using React JS which will sync with the indexDB to store the files and chunks to be uploaded.

Requirements:

1- Number of uploads must not exceed the 6 connections.
2- Limit the size of the file can be uploaded
3- The upload process can be stopped
4- the upload process can be resumed

Error handling

- timeout
- retries and resume

Data Integrity:

- use hash function

upload strategy

- Batch Processing: Upload files in batches to manage server load and reduce the risk of timeouts.
- Chunked Uploads: Divide large files into smaller chunks for upload to improve reliability and manage network interruptions.

- LIMIT:
  5 mb

- REQUEST_LIMIT
  6 connections

- Size:
  small 0 - 5 mb
  large > 5 mb

- Scenarios: - 1 small file direct upload

  - number > 1 file, each of them has a small size.
    - total size < 5 mb => send them all in one request
    - total size > 5 mb sent them in separated requests or ( send each collection of files in one request if the size is < 5 mb )
      - number of requests should not exceed the REQUEST_LIMIT

- USER ACTIONS :

  1. pause / stop
     resume
     remove (stored files or chunks)
     retry
     cancel and remove
     upload

- Status:
  pending (still in the store)
  success (uploaded)
  error (any kind of error that might happen)
  progress (currently uploading)
  paused (stopped by the user)
