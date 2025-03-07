# Securing SSH Access on Linux Servers

Secure Shell (SSH) is a crucial protocol for remote server administration, but it's also a common target for attackers. This guide covers essential security practices to harden SSH on your Linux servers and protect against unauthorized access.

## Basic SSH Security Measures

### 1. Use SSH Key Authentication

Password authentication is vulnerable to brute force attacks. SSH keys provide stronger security.

**Generate SSH key pair on your local machine:**

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

The Ed25519 algorithm offers strong security with small key sizes. For older systems that don't support Ed25519, use RSA with at least 4096 bits:

```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

**Transfer your public key to the server:**

```bash
ssh-copy-id username@remote_host
```

Alternatively, manually add your public key to `~/.ssh/authorized_keys` on the server.

**Disable password authentication** by editing `/etc/ssh/sshd_config`:

```
PasswordAuthentication no
ChallengeResponseAuthentication no
UsePAM no
```

Then restart the SSH service:

```bash
sudo systemctl restart sshd
```

### 2. Change the Default SSH Port

While security through obscurity isn't a complete solution, changing the default port reduces automated attacks.

Edit `/etc/ssh/sshd_config`:

```
# Change from 22 to something like 2222
Port 2222
```

Remember to update your firewall rules and connection commands after changing the port.

### 3. Limit User Access

Only allow specific users to connect via SSH:

```
AllowUsers user1 user2
```

Or use AllowGroups to permit entire groups:

```
AllowGroups sshusers admins
```

### 4. Disable Root Login

Never allow direct root login via SSH:

```
PermitRootLogin no
```

Instead, login as a regular user and use `sudo` for administrative tasks.

## Advanced Security Measures

### 1. Implement Fail2Ban

Fail2Ban monitors authentication logs and blocks IP addresses after multiple failed attempts.

**Install Fail2Ban:**

```bash
sudo apt install fail2ban
```

**Create a custom SSH jail configuration** in `/etc/fail2ban/jail.local`:

```
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
```

This configuration:
- Monitors SSH authentication
- Bans IPs after 3 failed attempts
- Sets ban duration to 1 hour (3600 seconds)

**Start and enable Fail2Ban:**

```bash
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

### 2. Implement Port Knocking

Port knocking adds an additional authentication layer by requiring a specific sequence of connection attempts before the SSH port becomes accessible.

**Install knockd:**

```bash
sudo apt install knockd
```

**Configure knockd** in `/etc/knockd.conf`:

```
[options]
    UseSyslog

[openSSH]
    sequence    = 5000,6000,7000
    seq_timeout = 10
    command     = /sbin/iptables -A INPUT -s %IP% -p tcp --dport 22 -j ACCEPT
    tcpflags    = syn

[closeSSH]
    sequence    = 7000,6000,5000
    seq_timeout = 10
    command     = /sbin/iptables -D INPUT -s %IP% -p tcp --dport 22 -j ACCEPT
    tcpflags    = syn
```

This configuration:
- Opens the SSH port after a sequence of connections to ports 5000, 6000, and 7000
- Closes the port after the reverse sequence

**Start and enable knockd:**

```bash
sudo systemctl start knockd
sudo systemctl enable knockd
```

**To connect, use the knock utility on your client:**

```bash
knock server_ip 5000 6000 7000
```

### 3. Configure Two-Factor Authentication (2FA)

Add an extra security layer with 2FA using Google Authenticator.

**Install Google Authenticator:**

```bash
sudo apt install libpam-google-authenticator
```

**Configure PAM** to use it by editing `/etc/pam.d/sshd`:

```
# Add this line at the end
auth required pam_google_authenticator.so
```

**Enable challenge-response authentication** in `/etc/ssh/sshd_config`:

```
ChallengeResponseAuthentication yes
AuthenticationMethods publickey,keyboard-interactive
```

**Run the setup for each user that needs 2FA:**

```bash
google-authenticator
```

Follow the prompts to configure the application, then restart SSH:

```bash
sudo systemctl restart sshd
```

## Network-Level Protection

### 1. Firewall Configuration

Use UFW (Uncomplicated Firewall) to restrict SSH access:

```bash
sudo ufw allow from trusted_ip_address to any port 22
```

Or with IP ranges:

```bash
sudo ufw allow from 192.168.1.0/24 to any port 22
```

### 2. SSH Connection Hardening

Configure additional hardening options in `/etc/ssh/sshd_config`:

```
# Use strong encryption
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com
# Use strong key exchange algorithms
KexAlgorithms curve25519-sha256@libssh.org,diffie-hellman-group-exchange-sha256
# Use strong MACs
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com

# Disable unused features
X11Forwarding no
AllowAgentForwarding no
AllowTcpForwarding no
PermitTunnel no

# Add connection timeouts
ClientAliveInterval 300
ClientAliveCountMax 2
LoginGraceTime 30
```

## Monitoring and Auditing

### 1. Set Up SSH Logging

Enhance SSH logging by editing `/etc/ssh/sshd_config`:

```
LogLevel VERBOSE
```

### 2. Implement Auditing

Install and configure auditd to monitor SSH activities:

```bash
sudo apt install auditd
```

Create SSH audit rules in `/etc/audit/rules.d/sshd.rules`:

```
-w /etc/ssh/sshd_config -p wa -k sshd_config
-w /etc/ssh/ -p wa -k ssh
```

### 3. Regular Log Review

Set up log monitoring using tools like Logwatch, or create a simple daily report:

```bash
sudo grep "sshd" /var/log/auth.log | grep "Invalid user\|Failed password"
```

## Conclusion

Implementing these security measures will significantly enhance your SSH server security. Always keep your system updated and regularly review security best practices. Remember that a multi-layered security approach is most effective, combining different strategies rather than relying on a single measure.

For critical servers, consider implementing a bastion host or jump server architecture to add an additional security layer between your SSH servers and the internet.

Remember to test all configurations before applying them to production systems to ensure you don't lock yourself out!