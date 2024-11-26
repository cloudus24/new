
const fs = require('fs')
exports.deleteFile = async (req, res) => {
  const path = req.file.path
  fs.unlink(path, (err) => {
    if (err) {
      console.error(err)
      res.status(500).send(err)
    } else {
      console.log('File deleted successfully')
      res.status(200).send('File deleted successfully')
    }
  })

}

exports.deleteFiles = async (req, res) => {
  const path = req.files.path
  fs.unlink(path, (err) => {
    if (err) {
      console.error(err)
      res.status(500).send(err)
    } else {
      console.log('File deleted successfully')
      res.status(200).send('File deleted successfully')
    }
  })

}

exports.deleteFilePath = async (req, res) => {
  const path = req.files[0].path
  fs.unlink(path, (err) => {
    if (err) {
      console.error(err)
      res.status(500).send(err)
    } else {
      console.log('File deleted successfully')
      res.status(200).send('File deleted successfully')
    }
  })

}

exports.deleteFilesPath = async (req, res) => {

  const path = req.files[0].path
  fs.unlink(path, (err) => {
    if (err) {
      console.error(err)
      res.status(500).send(err)
    } else {
      console.log('File deleted successfully')
      res.status(200).send('File deleted successfully')
    }
  })
}