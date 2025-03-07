
# Resolving UFW and Docker Networking Issues

#### **Goal**

The goal was to securely configure **Docker container networking** on a server running **UFW (Uncomplicated Firewall)** while allowing only specific public-facing services (such as **HTTPS** and **SSH**) to be exposed. We also needed to ensure that Docker containers could communicate with each other internally (within the **vpc_network**) without exposing unnecessary ports or services.

### **The Problem**

The core problem was that, when UFW was enabled, internal communication between Docker containers (e.g., Nginx Proxy Manager and Immich containers) was being blocked. This resulted in **504 Gateway Timeout** errors when attempting to proxy services through **Nginx Proxy Manager**.

Disabling UFW temporarily allowed traffic between containers, confirming that the firewall was the cause of the issue. However, we needed a solution that would keep UFW active for security while ensuring Docker container communication was not hindered.

### **Obstacles and Troubleshooting Steps**

---

#### **Sidequest 1: Initial Diagnosis of UFW and Docker Conflict**

1. **Initial Testing**:
    
    - We identified that the issue stemmed from **internal communication between Docker containers** being blocked when UFW was enabled.
    - The problem was temporarily fixed by disabling UFW, which allowed container communication but was not secure.
2. **Basic UFW Rules**:
    
    - Initially, UFW was configured to allow the necessary external ports for **HTTPS** and **SSH** access:
        
        `sudo ufw allow 443/tcp sudo ufw allow 3485/tcp`
        
    - However, these rules only handled incoming public traffic and didn’t address internal container communication.
        

---

#### **Sidequest 2: Investigating the FORWARD Chain**

1. **Identifying the FORWARD Chain Issue**:
    
    - The `FORWARD` chain in **iptables** was the key issue blocking inter-container traffic. Checking the chain with:
        
        `sudo iptables -L FORWARD`
        
    - We found that the default policy for the `FORWARD` chain was set to **DROP**, which blocked traffic between Docker containers.
        
2. **Temporary Fix with ACCEPT**:
    
    - Temporarily setting the `FORWARD` policy to **ACCEPT** allowed traffic between containers:
        
        
        `sudo iptables -P FORWARD ACCEPT`
        
    - While this resolved the communication issue, it opened up all forwarding, potentially exposing other traffic, which was not secure.
        
3. **Understanding the Impact of FORWARD**:
    
    - We needed a more targeted solution that would allow **specific Docker traffic** without accepting all forwarded traffic globally.

---

#### **Sidequest 3: Configuring Docker to Respect UFW via `iptables: false`**

1. **Docker's Interaction with iptables**:
    
    - Docker manages its own internal iptables rules to handle container networking. However, this can conflict with UFW if both try to manage the firewall rules simultaneously.
2. **Modifying Docker Daemon to Disable iptables Management**:
    
    - To resolve this conflict, we temporarily experimented with disabling Docker's management of iptables by modifying Docker’s daemon configuration:
        
        
        `sudo nano /etc/docker/daemon.json`
        
        Adding the line:

        
        `{   "iptables": false }`
        
    - This setting prevented Docker from overwriting iptables rules, allowing UFW to take full control of the firewall. After making the change, we restarted Docker:
        
        `sudo systemctl restart docker`
        
3. **Outcome**:
    
    - While this gave UFW full control, it also created complications because Docker relies on iptables for internal container communication. This led to additional networking issues, and we decided to revert this change.

    
    `sudo nano /etc/docker/daemon.json # Remove or comment out "iptables": false`
    

---

#### **Sidequest 4: Modifying UFW’s Configuration for the FORWARD Chain**

1. **Allowing Specific Forwarding for Docker Networks**:
    
    - Rather than setting the **FORWARD** chain to **ACCEPT** globally, we configured UFW to allow forwarding only for traffic within the **Docker subnet** (172.22.0.0/16). This allowed Docker containers to communicate while keeping the overall `FORWARD` chain policy set to **DROP**.
        
    - First, we added the following rule to allow traffic between Docker containers on the `vpc_network`:
        
        `sudo ufw allow from 172.22.0.0/16 to 172.22.0.0/16`
        
2. **Persistent Rule Changes in UFW’s before.rules**:
    
    - We edited UFW’s **before.rules** file to ensure that these forwarding rules persisted even after UFW was restarted or reloaded:
        
        `sudo nano /etc/ufw/before.rules`
        
    - Adding the following rules just before the `COMMIT` line:
        
        
```
        `*filter 
        :ufw-before-input - [0:0] 
        :ufw-before-output - [0:0] 
        :ufw-before-forward - [0:0]  
        # Allow Docker container traffic within the network 
        -A ufw-before-forward -s 172.22.0.0/16 -d 172.22.0.0/16 -j ACCEPT  
        # Allow established and related connections 
        -A ufw-before-forward -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT  COMMIT`
```
        
3. **Reloading UFW**:
    
    - After updating the rules, we reloaded UFW:
        
        `sudo ufw reload`
        
    - This ensured that the forwarding rules persisted across reboots and UFW reloads.
        

---

#### **Sidequest 5: Troubleshooting Logs and Blocked Traffic**

1. **Monitoring Logs for Blocked Traffic**:
    
    - We used UFW logs to identify where traffic was being blocked:
        `sudo tail -f /var/log/ufw.log`
        
    - The logs indicated that even after allowing the subnet, some traffic was still being blocked by UFW.
        
2. **Additional iptables and UFW Adjustments**:
    
    - We made additional adjustments to UFW and iptables, including explicitly allowing traffic on Docker’s bridge network interfaces:
        
        `sudo ufw allow in on br-c37aa38b4eb1 sudo ufw allow out on br-c37aa38b4eb1`
        
3. **Resetting iptables Rules**:
    
    - At one point, the iptables rules were cluttered due to multiple manual modifications. We reset iptables to a clean slate:
        
        `sudo iptables -F sudo iptables -P FORWARD DROP`
        
    - After resetting the rules, we re-applied the necessary UFW rules.
        

---

#### **Final Steps: Verifying Security and Connectivity**

1. **Securing Public Ports**:
    
    - We verified that only the necessary ports were exposed to the public. UFW rules allowed **port 443 (HTTPS)** and **port 3485 (SSH)** from specific sources:
        
        `sudo ufw status numbered`
        
2. **Internal Docker Communication**:
    
    - After all configurations, we ensured that **internal Docker communication** was functioning properly, with traffic being forwarded between containers within the **vpc_network**. We tested connectivity with:
        
        `sudo docker exec -it <nginx-proxy-manager-container> /bin/sh curl immich-server:2283`
        
3. **Clearing and Monitoring Logs**:
    
    - We cleared UFW logs to monitor fresh traffic:
        
        `sudo truncate -s 0 /var/log/ufw.log sudo tail -f /var/log/ufw.log`
        

---

### **Conclusion**

Through a combination of adjusting **UFW** rules, modifying **iptables**, and troubleshooting Docker's interaction with **UFW**, we were able to securely configure the server. This solution:

1. Ensures that **Docker containers can communicate** internally.
2. **Restricts public access** to only necessary services (HTTPS and SSH).
3. Keeps UFW in place for security, while maintaining the proper **FORWARD chain** behavior to avoid exposing unnecessary services.

This documentation outlines the steps taken to achieve a secure and functioning environment for Docker and UFW integration, with a focus on security and internal container communication.