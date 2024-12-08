document.addEventListener('DOMContentLoaded', function() {
    const petList = document.getElementById('petList');
  
    petList.addEventListener('click', async function(e) {
      if (e.target.classList.contains('delete-pet')) {
        const petId = e.target.dataset.id;
        const messageElement = document.getElementById('message');
  
        try {
          const response = await fetch(`/pets/${petId}`, {
            method: 'DELETE'
          });
  
          const result = await response.json();
  
          if (result.success) {
            document.getElementById(`pet-${petId}`).remove();
            messageElement.innerText = 'Pet deleted successfully!';
            messageElement.style.color = 'green';
          } else if (result.error) {
            messageElement.innerText = result.error;
            messageElement.style.color = 'red';
          }
        } catch (error) {
          messageElement.innerText = 'An error occurred: ' + error.message;
          messageElement.style.color = 'red';
        }
      }
    });
  });
  