
# coding: utf-8

# In[1]:


import sys
import nltk
nltk.download()


# In[4]:


import nltk
from nltk.corpus import stopwords
set(stopwords.words('english'))


# In[5]:


from nltk.corpus import stopwords 
from nltk.tokenize import word_tokenize 
from collections import Counter
  
#example_sent = "This is a sample sentence, showing off the stop words filtration."
#word_tokens = word_tokenize(example_sent)
s = open("C:\sample.txt").read()
word_tokens = word_tokenize(s) 

stop_words = open("C:\stopwords.txt").read()
#stop_words = set(stopwords.words('english')) 
  
filtered_sentence = [w for w in word_tokens if not w in stop_words] 
  
filtered_sentence = [] 

for w in word_tokens: 
    if w not in stop_words and len(w)>2: 
        filtered_sentence.append(w) 


print(word_tokens) 


# In[6]:


print(filtered_sentence)


# In[7]:


counts = Counter(filtered_sentence)
print(counts)


# In[13]:


uni_words = set(filtered_sentence)
for word in uni_words:
    print(word)
    with open('top_common.txt', 'w') as file:
     file.write(json.dumps(word))


# In[11]:


import json
import pandas as pd
import matplotlib.pyplot as plt



# In[ ]:


#print(dataToSendBack)
#sys.stdout.flush()

