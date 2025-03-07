# Custom Nginx Configurations

* Stop Training: Don't continue training for more epochs, as it's unlikely to improve validation accuracy further and might worsen the overfitting.

- Implement Early Stopping: Modify your training code to include early stopping. Monitor the validation loss or a metric like validation accuracy. If it doesn't improve for a certain number of epochs (the "patience" parameter), stop training automatically.

- Regularization Techniques: Apply regularization to reduce overfitting:
	- Increase Weight Decay: Try increasing the weight_decay parameter in your Adam optimizer. This adds a penalty to the loss function that discourages large weights, which can help prevent the model from memorizing the training data. Start with a small increase to the magnitude of this value. For example, if your current weight_decay is 1e-5, try 5e-5 or 1e-4.
	- Dropout: Add dropout layers to your model, especially after fully connected layers or convolutional layers with many parameters. Dropout randomly sets a fraction of the activations to zero during training, which forces the network to learn more robust features and reduces reliance on individual neurons. Start with a small dropout rate (e.g., 0.2 or 0.3) and increase it if needed.
	- Data Augmentation (if not already aggressive): If you aren't already using extensive data augmentation, consider adding more augmentations or making the current augmentations more aggressive. This will artificially create variations in the dataset, reducing overfitting.
Use tools like black or flake8 to standardize code formatting according to PEP 8 guidelines.

* pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu126*
# Add this in the "Custom Nginx Configuration" section in Advanced tab
location /ws {
    proxy_pass http://backend:8001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Enable websocket timeouts
proxy_read_timeout 300;
proxy_connect_timeout 300;
proxy_send_timeout 300;