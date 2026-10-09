const formData = new FormData();
formData.append('image', selectedImageFile);

fetch('http://127.0.0.1:5000/api/analyze-food', {
  method: 'POST',
  body: formData,
})
.then(res => res.json())
.then(data => console.log(data));
