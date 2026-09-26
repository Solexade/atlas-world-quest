// Ranked answers stay on the server. This public MVP bank is not a high-stakes examination.
const q = (id, region, category, prompt, options, answer, explanation) => ({id,region,category,prompt,options,answer,explanation});
export const RANKED = [
  q('r01','Africa','City clues','Which city is the capital of Kenya?',['Nairobi','Lagos','Accra','Cairo'],0,'Nairobi is Kenya\'s capital. Cities connect businesses, infrastructure and communities.'),
  q('r02','Africa','Landmark hunt','The pyramids at Giza are in which country?',['Morocco','Egypt','Kenya','Ghana'],1,'Giza is in Egypt. A landmark\'s popularity alone does not establish investment rights.'),
  q('r03','Europe','City clues','Which river runs through Paris?',['Thames','Danube','Seine','Rhine'],2,'The Seine runs through Paris. Rivers have long supported transport and trade.'),
  q('r04','Asia','Landmark hunt','Which Indian city is home to the Taj Mahal?',['Mumbai','Delhi','Jaipur','Agra'],3,'The Taj Mahal is in Agra. Cultural sites are not automatically assets available for tokenization.'),
  q('r05','Americas','Country clues','Which country is home to Machu Picchu?',['Peru','Brazil','Mexico','Chile'],0,'Machu Picchu is in Peru, in the Andes.'),
  q('r06','Oceania','Landmark hunt','The Sydney Opera House is in which country?',['New Zealand','Australia','Fiji','Samoa'],1,'Sydney is in Australia. Sydney is not Australia\'s capital; Canberra is.'),
  q('r07','Europe','Landmark hunt','Which city is home to the Colosseum?',['Athens','Madrid','Rome','Lisbon'],2,'The Colosseum is in Rome, Italy.'),
  q('r08','Asia','City clues','Which city is home to the Burj Khalifa?',['Doha','Riyadh','Abu Dhabi','Dubai'],3,'The Burj Khalifa is in Dubai, in the United Arab Emirates.'),
  q('r09','Africa','Country clues','Accra is the capital of which country?',['Ghana','Senegal','Uganda','Zambia'],0,'Accra is the capital of Ghana.'),
  q('r10','Americas','City clues','Which city is the capital of Canada?',['Toronto','Ottawa','Vancouver','Montreal'],1,'Ottawa is Canada\'s capital.'),
  q('r11','Asia','Country clues','Kyoto and Osaka are cities in which country?',['China','Thailand','Japan','Vietnam'],2,'Both cities are in Japan.'),
  q('r12','Europe','Landmark hunt','The Acropolis overlooks which city?',['Rome','Paris','Berlin','Athens'],3,'The Acropolis of Athens is in Greece.'),
  q('r13','Oceania','City clues','Which city is the capital of New Zealand?',['Wellington','Auckland','Sydney','Perth'],0,'Wellington is New Zealand\'s capital.'),
  q('r14','Americas','Country clues','Buenos Aires is the capital of which country?',['Uruguay','Argentina','Colombia','Ecuador'],1,'Buenos Aires is Argentina\'s capital.'),
  q('r15','Africa','City clues','Which city is Nigeria\'s capital?',['Lagos','Kano','Abuja','Ibadan'],2,'Abuja is Nigeria\'s capital. Lagos is a major commercial city.'),
  q('r16','Asia','Landmark hunt','Angkor Wat is in which country?',['Laos','Thailand','Malaysia','Cambodia'],3,'Angkor Wat is in Cambodia.'),
  q('r17','Europe','Asset connection','A port is most directly connected with which activity?',['Shipping and trade','Satellite navigation','Film production','Software licensing'],0,'Ports connect ships with land transport and storage infrastructure.'),
  q('r18','Africa','Asset connection','A grain warehouse is most directly linked to which sector?',['Telecommunications','Agriculture','Aviation','Entertainment'],1,'Warehouses store crops. A warehouse receipt still needs credible inventory and legal evidence.'),
  q('r19','Asia','Asset connection','Solar farms primarily produce what?',['Drinking water','Steel','Electricity','Timber'],2,'Solar panels convert sunlight into electricity. Investment claims require separate documentation.'),
  q('r20','Americas','Asset connection','Which asset is most directly associated with rental income?',['A passport','A weather forecast','A map pin','A leased building'],3,'A leased building may generate rent, but costs, vacancies and legal terms affect returns.'),
  q('r21','Europe','RWA checkpoint','Does a token using a famous company\'s ticker prove ownership of that company\'s stock?',['No; verify the issuer and legal rights','Yes, the ticker is sufficient','Only if the logo matches','Always on a testnet'],0,'A ticker or logo does not establish legal ownership. Check the issuer, custody and enforceable rights.'),
  q('r22','Africa','RWA checkpoint','What should back a claim that a token represents stored gold?',['An impressive website','Evidence of custody, reserves and legal rights','A large follower count','A rising token price'],1,'Custody, reserve evidence and legal documentation matter. None alone eliminates all risk.'),
  q('r23','Asia','RWA checkpoint','What does redemption mean in an asset-backed token arrangement?',['Changing your username','Doubling the token price','Exchanging the token under specified issuer terms','Automatically receiving dividends'],2,'Redemption depends on the issuer\'s terms, eligibility, costs and practical ability to fulfill it.'),
  q('r24','Americas','RWA checkpoint','What is concentration risk?',['A website loading slowly','A missing profile image','A short wallet address','Depending heavily on one asset or exposure'],3,'Diversification can reduce concentration, but it does not remove all risk.'),
  q('r25','Oceania','RWA checkpoint','What does a testnet token normally help developers do?',['Test software without using a production asset','Guarantee profits','Prove property ownership','Avoid checking smart contracts'],0,'Testnets are experimental environments. Testnet assets are not proof of real-world ownership.'),
  q('r26','Europe','Country clues','Lisbon is the capital of which country?',['Spain','Portugal','Italy','France'],1,'Lisbon is the capital of Portugal.'),
  q('r27','Asia','City clues','Which city is the capital of South Korea?',['Busan','Tokyo','Seoul','Beijing'],2,'Seoul is the capital of South Korea.'),
  q('r28','Americas','Landmark hunt','Christ the Redeemer overlooks which city?',['Lima','Santiago','Bogota','Rio de Janeiro'],3,'Christ the Redeemer overlooks Rio de Janeiro in Brazil.'),
  q('r29','Africa','Asset connection','A desalination plant is used primarily to produce what?',['Fresh water','Copper','Natural gas','Cement'],0,'Desalination removes salts from water. Such plants are part of water infrastructure.'),
  q('r30','Oceania','RWA checkpoint','A token has few buyers. Which risk might make selling difficult?',['Display resolution','Liquidity risk','Password length','Map accuracy'],1,'Liquidity risk concerns the ability to buy or sell at a reasonable price when needed.')
];
export const PRACTICE = [
  q('p01','Europe','Landmark hunt','The Eiffel Tower is in which city?',['Paris','Rome','Vienna','Prague'],0,'The Eiffel Tower is in Paris, France.'),
  q('p02','Africa','Country clues','Mount Kilimanjaro is in which country?',['Kenya','Tanzania','Ethiopia','Ghana'],1,'Mount Kilimanjaro is in Tanzania.'),
  q('p03','Asia','Asset connection','Which facility helps move goods between ships and trucks?',['A stadium','A museum','A container terminal','An observatory'],2,'Container terminals connect maritime shipping with inland transport.'),
  q('p04','Americas','City clues','Which city is the capital of the United States?',['New York','Boston','Chicago','Washington, D.C.'],3,'Washington, D.C. is the US capital.'),
  q('p05','Oceania','RWA checkpoint','Does an onchain transaction prove a building exists and is legally owned by token holders?',['No, external evidence and legal terms matter','Yes, always','Only if gas was expensive','Only if it is on a testnet'],0,'Blockchain records and real-world legal claims are different. Both require appropriate verification.')
];
