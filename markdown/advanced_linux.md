# Linux Advanced Important Commands and Methodologies

### **Disabling the Laptop sleep or suspend function in Ubuntu Server**

1. . Edit the `logind.conf` file using a text editor like `nano` or `vim`. You may need superuser privileges to edit this file, so use `sudo`:
	    `sudo nano /etc/systemd/logind.conf`
2. In the `logind.conf` file, locate the line that starts with `#HandleLidSwitch=`. This line controls the behavior of the laptop lid switch.
3. Uncomment (remove the `#`) from the beginning of the line and set the value to `ignore`:
    `HandleLidSwitch=ignore`
    This change tells systemd to ignore the lid switch events.
4. To apply the changes, you need to restart the systemd-logind service. Use the following command:
		`sudo systemctl restart systemd-logind`

### **See which Network Administration the Linux Distro is using**

1. `systemctl status NetworkManager` or `systemd-networkd` or `wicd` or `networking` If it's active and running, you'll see the status as "active (running)"

### **Set a Static IP and DNS Addresses with `systemd-networkd:`**

1. Identify your network interface (`eth0`, `ens33`, etc.) using `ifconfig` or `ip a`
2. Create a `.network` file for the interface:
    `sudo nano /etc/systemd/network/enp3s0.network`
3. In the file, set the static IP, subnet mask, gateway, and DNS servers:
GFH   -0```
[Match]
Name=eth0   # Replace with your interface name

[Network]
Address=192.168.1.100/24   # Set your IP and subnet
Gateway=192.168.1.1        # Set your gateway
DNS=8.8.8.8                 # Set primary DNS
DNS=8.8.4.4                 # Set secondary DNS (optional)

4. Save (Ctrl + O, then Enter) and exit (Ctrl + X) the file.
5. Reload systemd-networkd:
    `sudo systemctl restart systemd-networkd`
6. Verify settings:
    `systemctl status systemd-networkd`
Your static IP and DNS settings are now configured for your network interface.


## **Recover and Remount lost partition that was mounted.**

**Problem:** After resetting your password via GRUB, your `/mnt/filecloud` partition appeared missing, with seemingly vanished files.

**Troubleshooting and Recovery Steps:**
1. **Identify Missing fstab Entry:**
    - **Command:** `cat /etc/fstab`
    - **Purpose:** Examined the file system table to see if the partition was configured to mount automatically.
2. **Verify Partition Existence:**
    - **Command:** `sudo fdisk -l /dev/sda` (replace `/dev/sda` if needed)
    - **Purpose:** Checked the partition table to ensure the partition still existed on the hard disk.
3. **Retrieve Partition UUID:**
    - **Command:** `sudo blkid | grep sda`
    - **Purpose:** Obtained the unique identifier of the partition for correct `fstab` configuration.
4. **Update fstab:**
    - **Command:** `sudo nano /etc/fstab`
    - **Action:** Edited the file and added the following line (replace UUID and mount point):    
        ```
        UUID=<UUID> /mnt/filecloud ext4 defaults 0 2         ```        
5. **Mount the Partition:**
    - **Command:** `sudo mount /mnt/filecloud`
    - **Purpose:** Manually mounted the partition to make it accessible.
6. **(Optional) Filesystem Check:**
    - **Command:** `sudo fsck -t ext4 /dev/sda1`
    - **Purpose:** Verified and, if necessary, repaired filesystem integrity in case of corruption issues.

## **Resize and Allocate Space for New Partition**

**Problem:** There was a need to reallocate 200GB from an existing partition used by Filecloud to create a new partition for Nextcloud.

**Troubleshooting and Recovery Steps:**
1. **Backup Data:**
    - **Command:** (manual backup process as appropriate)
    - **Purpose:** Ensured data safety before manipulating disk partitions.

2. **Unmount Existing Partition:**
    - **Command:** `sudo umount /mnt/filecloud`
    - **Purpose:** Safely unmounted the Filecloud partition to prevent data corruption during resizing.

3. **Resize Existing Filesystem:**
    - **Command:** `sudo resize2fs /dev/sda1 716G`
    - **Purpose:** Reduced the size of the Filecloud's filesystem to free up space for Nextcloud.

4. **Adjust Partition Size:**
    - **Command:** `sudo parted /dev/sda resizepart 1 716GB`
    - **Purpose:** Trimmed the partition to match the new filesystem size, freeing up 200GB of space.

5. **Create New Partition:**
    - **Command:** `sudo parted /dev/sda mkpart primary 716GB 916GB`
    - **Purpose:** Created a new partition in the freed space for Nextcloud.

6. **Format New Partition:**
    - **Command:** `sudo mkfs.ext4 /dev/sda2`
    - **Purpose:** Prepared the new partition with an ext4 filesystem for use by Nextcloud.

7. **Mount New Partition:**
    - **Command:** `sudo mount /dev/sda2 /mnt/nextcloud`
    - **Purpose:** Mounted the new partition to make it accessible for Nextcloud installation.

8. **Update fstab for Auto-Mount:**
    - **Command:** `echo '/dev/sda2 /mnt/nextcloud ext4 defaults 0 2' | sudo tee -a /etc/fstab`
    - **Purpose:** Added the new partition to fstab to ensure it mounts automatically at boot.

9. **Verify and Check New Setup:**
    - **Command:** `df -h` and `mount | grep nextcloud`
    - **Purpose:** Checked that the new partition was correctly mounted and available with the intended space allocation.

## **Remove Lets-Encrypt CA Signed Certifications**

1. First, list all the certificates that have been issued to verify what you have:
	* `sudo certbot certificates`
2. To delete a specific certificate, use the `delete` command with Certbot:
	* `sudo certbot delete --cert-name example.com
3. Certbot stores certificates and related files in the `/etc/letsencrypt` directory. If you want to manually clean up or if some files were left behind, you can remove them:

	sudo rm -rf /etc/letsencrypt/live/example.com
	sudo rm -rf /etc/letsencrypt/archive/example.com
	sudo rm -rf /etc/letsencrypt/renewal/example.com.conf

`sudo rm -rf /etc/letsencrypt` To remove all traces of local certificates.

## **Automatically Remount Disk Drives on Boot using FSTAB  Important**

#### Step 1: Identify the UUID of `/dev/sda1`

First, identify the UUID (Universally Unique Identifier) of the partition. Using the UUID instead of the device name in `/etc/fstab` is more reliable, especially if device names change.

`sudo blkid /dev/sda1`

Step 2: Edit /etc/fstab

Edit the `etc/fstab` file to include an entry for `/dev/sda1.`
`sudo nano /etc/fstab`

Add the following line to the file, replacing `your-uuid-here` with the actual UUID from the `blkid` command:

`UUID=33e366d7-223c-47dd-8374-258b89ad4b57 /mnt/nextcloud ext4 defaults 0 2
`
curl -ksvo /dev/null http://nextcloud.com --connect-to ::10.168.77.10 2>&1 | egrep -i "< location|< http"

Disabling The Landing Dashboard Page in Next Cloud

``  'defaultapp' => 'files',`

## **How to manage and delegate AWS S3 Bucket with Third party - Mult-Cloud **

Step 2: Create an IAM user

1. Sign in to the AWS Management Console and open the IAM console.
2. In the navigation pane, choose "Users" and then "Add user".
3. Set the user details:
   - User name: Choose a name like "MultCloud-Sync"
   - Select "Programmatic access" under "Access type"
4. For permissions, choose "Attach existing policies directly"
5. Create a custom policy:
   - Click "Create policy"
   - Use the JSON editor and paste a policy like this:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:ListBucket",
           "s3:DeleteObject"
         ],
         "Resource": [
           "arn:aws:s3:::your-bucket-name",
           "arn:aws:s3:::your-bucket-name/*"
         ]
       }
     ]
   }
   ```

   Replace "your-bucket-name" with your actual S3 bucket name.
6. Review and create the user.

Step 3: Set up bucket policy

1. Go to the S3 console and select your bucket.
2. Click on the "Permissions" tab.
3. Under "Bucket policy", click "Edit".
4. Add a policy like this:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "AWS": "arn:aws:iam::your-account-id:user/MultCloud-Sync"
         },
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:ListBucket",
           "s3:DeleteObject"
         ],
         "Resource": [
           "arn:aws:s3:::your-bucket-name",
           "arn:aws:s3:::your-bucket-name/*"
         ]
       }
     ]
   }
   ```

   Replace "your-account-id" with your AWS account ID and "your-bucket-name" with your bucket name.

Step 4: Generate access keys

1. In the IAM console, go to the user you created (e.g., "MultCloud-Sync").
2. Go to the "Security credentials" tab.
3. Under "Access keys", click "Create access key".
4. Download or copy the Access Key ID and Secret Access Key.
5. Store these securely; you won't be able to view the Secret Access Key again.

Step 5: Set up MultCloud

1. Create a MultCloud account at https://www.multcloud.com/
2. Click "Add Cloud Drives" and select Google Photos.
3. Authenticate and authorize MultCloud to access your Google Photos.
4. Click "Add Cloud Drives" again and select "S3 Compatible Storage".
5. Fill in the details:
   - Display Name: Choose a name for this connection
   - S3 Server Name: s3.amazonaws.com
   - Access Key ID: Paste the Access Key ID from Step 4
   - Secret Access Key: Paste the Secret Access Key from Step 4
   - Bucket: Your S3 bucket name
6. Click "Add S3 Compatible Storage" to finish.

Now you have both your Google Photos and Amazon S3 bucket connected to MultCloud. From here, you can set up your sync tasks.

## Installing NVIDEA Drivers in Linux.x64 server. 

1. Identify your GPU model:
   Run the following command to get information about your NVIDIA GPU:
   ```
   lspci | grep -i nvidia
   ```

2. Update your system:
   Make sure your system is up to date before installing new drivers:
   ```
   sudo apt update && sudo apt upgrade
   ```
   (Use your distribution's package manager if not using apt)

3. Remove any existing NVIDIA drivers:
   ```
   sudo apt remove nvidia* && sudo apt autoremove
   ```

4. Add the NVIDIA driver repository (for Ubuntu-based systems):
   ```
   sudo add-apt-repository ppa:graphics-drivers/ppa
   sudo apt update
   ```

5. Install the latest NVIDIA driver:
   You can use the following command to install the recommended driver:
   ```
   sudo apt install nvidia-driver-xxx
   ```
   Replace 'xxx' with the latest version number available for your system.

6. Reboot your system:
   ```
   sudo reboot
   ```

7. Verify the installation:
   After rebooting, you can check if the driver is installed correctly:
   ```
   nvidia-smi
   ```

## Installing the NVIDIA Container Toolkit for Hardware Acceleration Machine Learning 

1. Configure the production repo:
```
   curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg \
  && curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
```
2. Optionally, configure the repository to use experimental packages:
```
sed -i -e '/experimental/ s/^#//g' /etc/apt/sources.list.d/nvidia-container-toolkit.list
```
3. Update the packages list from the repository
```
sudo apt-get update
```
4. Install the NVIDIA Container Toolkit packages:
```
sudo apt-get install -y nvidia-container-toolkit
nvidia-container-toolkit --version
```
