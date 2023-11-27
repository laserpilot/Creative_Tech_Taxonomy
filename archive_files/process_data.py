import json
 
# Opening JSON file
f = open('all_data.json')
data = json.load(f)
processedData = None

class EachLayer():
    # The class "constructor" - It's actually an initializer 
    def __init__(self, name, children):
        self.name = name
        if children is not None :
            self.children = children
        
    # obsolete function
    def __repr__(self):
        if self.children:
            print(self.children)
            return f"<name:{self.name} children:{self.children}>"
        else:
            return f"<name:{self.name}"

# def format_all_data(data):
#     # print(data)
#     allChildren = []
#     for eachKey in data.keys(): # loop over the first layer
#         allChildren.append(EachLayer(eachKey, format_data(data.get(eachKey))))
        
#     return allChildren

# a recursive function that formats data into D3's hierachy
def format_data(curData):
    
    currCildren = []
    
    for eachKey in curData.keys(): # loop over the keys in children
        # print(eachKey)
        # if curData has children
        if curData.get(eachKey):
            currCildren.append(EachLayer(eachKey, format_data(curData.get(eachKey))))
        else:
            currCildren.append(EachLayer(eachKey, None))


    return currCildren



processedData = format_data(data) 

processedData = {"name":"creative tech", "children": processedData}

# print(repr(processedData))
# print(processedData.__dict__)
# write nested class to json in python: https://www.geeksforgeeks.org/serialize-and-deserialize-complex-json-in-python/ 
final_data = json.dumps(processedData, default=lambda o: o.__dict__, indent=4)
print(final_data)


# write to json
with open("processed_data.json", "w") as outfile:
    outfile.write(final_data)