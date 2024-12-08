document.addEventListener('DOMContentLoaded', function() {
  const userList = document.getElementById('userList');

  userList.addEventListener('click', async function(e) {
    if (e.target.classList.contains('deactivate-user')) {
      const userId = e.target.dataset.id;
      const messageElement = document.getElementById('message');

      try {
        const response = await fetch(`/users/deactivate/${userId}`, {
          method: 'PUT'
        });

        const result = await response.json();

        if (result.success) {
          document.getElementById(`user-${userId}`).querySelector('.deactivate-user').disabled = true;
          document.getElementById(`user-${userId}`).querySelector('p').innerText = 'Status: Deactivated';
          messageElement.innerText = 'User account deactivated successfully!';
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

  userList.addEventListener('change', async function(e) {
    if (e.target.classList.contains('change-role')) {
      const userId = e.target.dataset.id;
      const role = e.target.value;
      const messageElement = document.getElementById('message');

      try {
        const response = await fetch(`/admin/change-role/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role })
        });

        const result = await response.json();

        if (result.success) {
          messageElement.innerText = 'User role changed successfully!';
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
