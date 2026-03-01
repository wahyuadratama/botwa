class OwnerUtils {
  static normalizeNumber(number) {
    // Remove all non-numeric characters and common suffixes
    let clean = number.replace(/[@s.whatsapp.net@lid@c.us]/g, '');
    
    // Remove common prefixes and normalize
    if (clean.startsWith('+')) clean = clean.substring(1);
    if (clean.startsWith('62')) clean = clean.substring(2);
    if (clean.startsWith('0')) clean = clean.substring(1);
    
    return clean;
  }
  
  static generateAllFormats(baseNumber) {
    const normalized = this.normalizeNumber(baseNumber);
    return [
      normalized,                    // Base: 85223980822
      '0' + normalized,             // With 0: 085223980822  
      '62' + normalized,            // With 62: 6285223980822
      '+62' + normalized,           // With +62: +6285223980822
      baseNumber                    // Original format
    ];
  }
  
  static isOwnerNumber(senderNumber, ownerNumbers) {
    const senderNormalized = this.normalizeNumber(senderNumber);
    
    return ownerNumbers.some(ownerNum => {
      const ownerNormalized = this.normalizeNumber(ownerNum);
      
      // Direct match on normalized numbers
      if (senderNormalized === ownerNormalized) return true;
      
      // Check if one contains the other (for partial matches)
      if (senderNormalized.includes(ownerNormalized) || ownerNormalized.includes(senderNormalized)) {
        // Only match if the difference is reasonable (not too different)
        const diff = Math.abs(senderNormalized.length - ownerNormalized.length);
        return diff <= 3; // Allow small differences
      }
      
      return false;
    });
  }
}

module.exports = OwnerUtils;