# Configuring Docker to Respect UFW and iptables Rules

### **Objective**

The primary objective of this documentation is to configure Docker to work with UFW (`Uncomplicated Firewall`) and respect `iptables` rules. By default, Docker can bypass UFW rules due to the way it handles networking and iptables configurations, which can lead to security issues. This guide explains how to ensure that Docker’s bridge network respects UFW firewall rules and enforces proper network filtering.

### **Problem Statement**

When Docker is installed on a Linux system, it manipulates `iptables` rules directly, creating custom chains (`DOCKER`, `DOCKER-USER`, etc.) to route traffic to containers. This often causes Docker to bypass UFW rules, making ports accessible even when UFW is configured to block them.

For example, even when UFW is set to `DENY` incoming connections on port 80 and 443, Docker containers may still respond to traffic on these ports. This poses a potential security risk, as it exposes services that should otherwise be restricted.

### **Solution Overview**

The solution involves configuring Docker and the Linux kernel to ensure that Docker traffic is filtered through UFW’s rules. This includes:

1. Enabling `bridge-nf-call-iptables` and `bridge-nf-call-ip6tables` kernel parameters.
2. Modifying Docker’s behavior with a custom `daemon.json` configuration.
3. Configuring UFW rules to enforce filtering.
4. Verifying the setup through testing and validation.

### **System Setup and Environment**

- **Operating System**: Ubuntu 22.04 LTS (or any Debian-based system)
- **Docker Version**: `Docker Engine - Community` 24.0+
- **UFW Version**: `UFW` 0.36+
- **Network Setup**: Public IP (`174.164.88.43`) and Local IP (`10.168.77.10`)
- **Docker Containers**: Nginx Proxy Manager, Nextcloud, etc.

### **Step 1: Enable Kernel Parameters for Docker**

Docker requires the `br_netfilter` module to be loaded and `bridge-nf-call-iptables` to be enabled to ensure that bridge network packets are processed through `iptables`.

#### **1.1 Load the `br_netfilter` Module**

Ensure the `br_netfilter` module is loaded:
```
sudo modprobe br_netfilter
```
Verify that the module is loaded:
```
lsmod | grep br_netfilter
```
Output:
```
br_netfilter           28672  0
bridge                 159744  1 br_netfilter
```
This confirms that the `br_netfilter` module is loaded.

#### **1.2 Enable `bridge-nf-call-iptables` and `bridge-nf-call-ip6tables`**

Create a new sysctl configuration file for Docker:
```
sudo nano /etc/sysctl.d/99-docker.conf
```
Add the following lines to the file:
```
net.bridge.bridge-nf-call-iptables=1
net.bridge.bridge-nf-call-ip6tables=1
```
Save and exit the file. Apply the changes:
```
`sudo sysctl --system`
```
Verify the settings by manually typing this and read the response:
```
sudo sysctl net.bridge.bridge-nf-call-iptables
sudo sysctl net.bridge.bridge-nf-call-ip6tables
```
Output:
```
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
```
### **Step 2: Configure Docker to Respect iptables Rules**

Docker, by default, manages `iptables` rules itself. To ensure UFW rules are enforced, disable Docker’s direct manipulation of `iptables`.

#### **2.1 Create or Modify Docker’s `daemon.json` File**

Create or edit Docker’s daemon configuration file: and add
``sudo nano /etc/docker/daemon.json``
```
{
    "iptables": false
}
```

`sudo systemctl daemon-reload`

Save and exit the file.

#### **2.2 Restart Docker Service**

Restart Docker to apply the new configuration:
`sudo systemctl restart docker
`
Verify that Docker is no longer managing iptables directly:
`sudo docker info | grep -i iptables`
Verify that Docker is no longer managing iptables directly:
`sudo docker info | grep -i iptables`
Output:
```
WARNING: No iptables proxy configured, Docker will not manage iptables rules
```
This warning confirms that Docker is no longer manipulating `iptables` rules.

### **Step 3: Configure UFW Rules**

Now that Docker respects the host’s firewall rules, configure UFW to block or allow specific ports as needed.

### **Troubleshooting and Common Issues*

During the configuration of Docker to respect UFW and iptables, several challenges were encountered. This section provides a detailed explanation of these issues, the solutions applied, and potential tips for handling similar problems in the future.

Issue 1: `bridge-nf-call-iptables` and `bridge-nf-call-ip6tables` Not Enabled

Description: When trying to enable the kernel parameters `bridge-nf-call-iptables` and `bridge-nf-call-ip6tables`, the following error was encountered:

```
sysctl: cannot stat /proc/sys/net/bridge/bridge-nf-call-iptables: No such file or directory
```

Cause: This error occurs when the br_netfilter kernel module is not loaded. The br_netfilter module is required to allow bridge network packets to be processed through iptables.

Solution:

Load the `br_netfilter` module using modprobe:

```
sudo modprobe br_netfilter
```
Verify that the module is loaded:

```
lsmod | grep br_netfilter
```

If the module is not available, install the necessary kernel modules

```
sudo apt-get install linux-modules-extra-$(uname -r)
```

Enable `bridge-nf-call-iptables` and `bridge-nf-call-ip6tables` in the `/etc/sysctl.d/99-docker.conf` file, then apply the configuration:

    sudo sysctl --system

**Verification**: Run the following commands to confirm that the settings have been applied:

```
sudo sysctl net.bridge.bridge-nf-call-iptables
sudo sysctl net.bridge.bridge-nf-call-ip6tables
```

Expected output:
```
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
```

**Issue 2: Docker Bypassing UFW Rules Despite Configuration**

**Description:** After enabling the necessary kernel parameters and configuring Docker’s daemon.json, Docker containers were still accessible on blocked ports, indicating that Docker was bypassing UFW rules.

**Cause:** Docker may bypass UFW rules if its iptables settings are not correctly applied or if the DOCKER-USER chain is not utilized properly.

**Solution:**

Modify Docker’s `daemon.json` to include the `"iptables"`: false configuration:

`sudo nano /etc/docker/daemon.json`

Add:
```
{
    "iptables": false
}
```

Restart Docker to apply the changes:

`sudo systemctl restart docker`

Verify that Docker is no longer managing iptables directly:

`sudo docker info | grep -i iptables`

Expected output:

```
WARNING: No iptables proxy configured, Docker will not manage iptables rules
```

Ensure UFW rules are reloaded and applied correctly:

```
sudo ufw disable
sudo ufw enable
```
Use iptables to manually add rules to the DOCKER-USER chain if necessary:

bash

    sudo iptables -I DOCKER-USER -i eth0 -p tcp --dport 80 -j DROP
    sudo iptables -I DOCKER-USER -i eth0 -p tcp --dport 443 -j DROP

**Issue 3:** Docker Container Traffic Still Accessible on Internal Network

Description: Even after configuring UFW to block ports 80 and 443, Docker containers were still accessible from the internal network.

Cause: UFW was configured to block access only for external sources, leaving internal traffic unrestricted.

Solution:

Modify UFW rules to include internal network restrictions:

```
sudo ufw deny in on eth0 to any port 80
sudo ufw deny in on eth0 to any port 443
```

If internal access is still needed for certain IP ranges, create a more specific rule:


    sudo ufw allow from 192.168.1.0/24 to any port 80

This allows access only from the 192.168.1.0/24 subnet while blocking other internal IP ranges.

**Issue 4:** Docker iptables Warnings Related to `bridge-nf-call-iptables`

Description: The following warnings were observed when checking Docker’s status:

```
WARNING: bridge-nf-call-iptables is disabled
WARNING: bridge-nf-call-ip6tables is disabled
```

Cause: This warning indicates that the `bridge-nf-call-iptables` and `bridge-nf-call-ip6tables` settings are not enabled in the kernel, which prevents Docker from interacting with iptables correctly.

Solution: Enable the kernel parameters as described in Issue 1. Verify that the settings are applied by running:

```
sudo sysctl net.bridge.bridge-nf-call-iptables
sudo sysctl net.bridge.bridge-nf-call-ip6tables
```

Restart Docker and UFW to apply the changes:

```
sudo systemctl restart docker
sudo ufw disable && sudo ufw enable

```
Check Docker’s iptables status again to ensure no warnings are present:

    sudo docker info | grep -i iptables

**Additional Tips and Best Practices**

- Use the DOCKER-USER Chain for Custom Rules: Always use the DOCKER-USER chain for custom rules instead of directly modifying Docker’s chains. This ensures that your rules are applied before Docker’s default rules.

- Persist iptables Rules Across Reboots: Use the iptables-persistent package to save custom iptables rules and ensure they persist across reboots:

```
 sudo apt-get install iptables-persistent
sudo netfilter-persistent save
```

- Monitor Docker’s Behavior After Updates: Docker updates can sometimes reset configurations or modify iptables behavior. Always recheck your configurations after a Docker update.