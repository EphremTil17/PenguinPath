# Resize and Allocate Space for New Partition

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
