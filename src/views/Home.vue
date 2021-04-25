<template>
  <div class="home">
      <!-- <div class="loader"></div> -->
    <v-card>
      <v-card-title>
        Employee Data
        <v-spacer></v-spacer>
        <div class="search">
          <input type="text" name="" value="" @input="debounceSearch" v-model="search" placeholder="Type to Search (country or job title)" class="search-input">
          <!-- <v-btn depressed small class="search-btn" color="primary" @click="searchData"> Search </v-btn> -->
        </div>
        <v-btn depressed small color="primary" @click="generateRandomData">
          Randomize Data
          <v-progress-circular
            v-if="loading"
            indeterminate
            color="default"
            :size="15"
            :width="2"
          ></v-progress-circular>
        </v-btn>
      </v-card-title>
      <v-data-table :headers="headers" :items.sync="employData" :loading="loading">
        <template v-slot:item.actions="{ item }">
        <v-icon small class="mr-1" @click="editItem(item); dialog = true;editMode = true;"> mdi-pencil </v-icon>
        <v-icon small class="mr-1" @click="deleteItem(item)"> mdi-delete </v-icon>
        <v-icon small @click="showEmpData(item); editMode = false; dialog = true;"> mdi-eye </v-icon>
      </template>
      </v-data-table>

      <v-dialog v-model="dialog" persistent max-width="600" max-height="350">
          <v-card>
            <v-card-title class="headline">
              Employee Details
              <v-spacer></v-spacer>
              <v-btn
                v-if="!editMode"
                color="red darken-1"
                text
                @click="dialog = false; editMode = false;"
              >
                Close
              </v-btn>
            </v-card-title>
            <v-card-text>
              <div class="detail-form">
                <v-row v-if="editMode">
                  <v-col cols="12" md="6">
                    <v-text-field label="Name" v-model="emp.name" ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field label="Email" v-model="emp.email" ></v-text-field>
                  </v-col>
                </v-row>
                <v-row v-if="editMode">
                  <v-col cols="12" md="6">
                    <v-text-field label="Job Title" v-model="emp.job_title" ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field label="Country" v-model="emp.country" ></v-text-field>
                  </v-col>
                </v-row>
                <div class="emp-data-graph" v-show="!editMode">
                  <div class="emp-details">
                    <v-row>
                      <v-col cols="12" md="6">
                        <p><b>Name:</b> &nbsp; {{emp.name}}</p>
                      </v-col>
                      <v-col cols="12" md="6">
                        <p><b>Email:</b> &nbsp; {{emp.email}}</p>
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col cols="12" md="6">
                        <p><b>Job Title:</b> &nbsp; {{emp.job_title}}</p>
                      </v-col>
                      <v-col cols="12" md="6">
                        <p><b>Country:</b> &nbsp; {{emp.country}}</p>
                      </v-col>
                    </v-row>
                  </div>
                  <div id="chartdiv" ref="chartdiv"></div>
                </div>
              </div>
            </v-card-text>
            <v-card-actions v-if="editMode">
              <v-spacer></v-spacer>
              <v-btn
                color="red darken-1"
                text
                @click="dialog = false; editMode = false;"
              >
                Cancel
              </v-btn>
              <v-btn
                color="green darken-1"
                text
                @click="dialog = false; editMode = false; saveData();"
              >
                Save
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <v-dialog v-model="deleteDialog"  max-width="290">
          <v-card>
            <v-card-title class="headline">
              Delete Details
            </v-card-title>
            <v-card-text>Are You Sure You Want to <b>Delete</b> This Employee Details - {{emp.name}} - {{emp.email}} ?? </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="green darken-1" text @click="deleteDialog = false;"> No </v-btn>
              <v-btn color="red darken-1" text @click="deleteDialog = false; deleteData()"> Yes </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
    </v-card>
  </div>
</template>

<script>
  import axios from 'axios'
  import * as am4core from "@amcharts/amcharts4/core";
  import * as am4charts from "@amcharts/amcharts4/charts";
  import am4themes_animated from "@amcharts/amcharts4/themes/animated";

  am4core.useTheme(am4themes_animated);



  export default {
    name: 'Home',
    data() {
      return {
        search: '',
        loading: false,
        headers: [
          { text: 'ID', value: 'id', filterable: false, sortable: false },
          { text: 'Job Title', value: 'job_title', sortable: true, filterable: true },
          { text: 'Email Address', value: 'email', sortable: false,filterable: false },
          { text: 'Name', value: 'name', sortable: false,filterable: false },
          { text: 'Country', value: 'country', sortable: true, filterable: true },
          { text: 'Salary for Q1', value: 'q1', sortable: false, filterable: false},
          { text: 'Salary for Q2', value: 'q2', sortable: false, filterable: false},
          { text: 'Salary for Q3', value: 'q3', sortable: false, filterable: false},
          { text: 'Salary for Q4', value: 'q4', sortable: false, filterable: false},
          { text: 'Total Salary', value: 'total_salary', sortable: false, filterable: false},
          { text: 'Total Hours', value: 'work_hr', sortable: false, filterable: false},
          { text: 'Actions', value: 'actions', sortable: false, filterable: false}
        ],
        employData: [],
        totalDataset: [],
        debounce: null,
        dialog: false,
        emp: {},
        editMode: false,
        deleteDialog: false
      }
    },
    mounted() {
      this.generateRandomData()
    },
    methods: {
      debounceSearch () {
        this.loading = true
        clearTimeout(this.debounce)
        this.debounce = setTimeout(() => {
          if (this.search.length > 3) {
            this.searchData()
          } else {
            this.employData = this.totalDataset
            this.loading = false
          }
        }, 600)
      },

      editItem (item) {
        console.log(item);
        this.emp = item
      },

      deleteItem (item) {
        console.log(item);
        this.deleteDialog = true
        this.emp = item
      },

      deleteData() {
        this.employData.forEach((i, key) => {
          if (i.email == this.emp.email) {
            this.employData.splice(key, 1)
          }
        });
        this.totalDataset.forEach((i, key) => {
          if (i.email == this.emp.email) {
            this.totalDataset.splice(key, 1)
          }
        });

      },

      showEmpData (item) {
        console.log(item);
        this.emp = item
        this.createChart(item)
      },

      saveData() {
        if (this.employData[this.emp.id -1].email == this.emp.email) {
            this.employData[this.emp.id -1] = this.emp
        }
        if (this.totalDataset[this.emp.id -1].email == this.emp.email) {
            this.totalDataset[ithis.emptem.id -1] = this.emp
        }
      },

      createChart (item) {
        console.log(item);
        let chart = am4core.create(this.$refs.chartdiv, am4charts.XYChart);


        chart.exporting.menu = new am4core.ExportMenu();
        let data = [
          {
            sec: 'q1',
            q: item.q1,
            w_q: item.w_q1
          },
          {
            sec: 'q2',
            q: item.q2,
            w_q: item.w_q2
          },
          {
            sec: 'q3',
            q: item.q3,
            w_q: item.w_q3
          },
          {
            sec: 'q4',
            q: item.q4,
            w_q: item.w_q4
          }

        ]

        chart.data = data;


        /* Create axes */
        let categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
        categoryAxis.name = 'Quator'
        categoryAxis.dataFields.category = "sec";
        categoryAxis.renderer.minGridDistance = 30;

        /* Create value axis */
        let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());

        /* Create series */
        let columnSeries = chart.series.push(new am4charts.ColumnSeries());
        columnSeries.name = "Salary per Quator";
        columnSeries.dataFields.valueY = "q";
        columnSeries.dataFields.categoryX = "sec";

        columnSeries.columns.template.tooltipText = "[#fff font-size: 15px]{name} in {categoryX}:\n[/][#fff font-size: 20px]{valueY}[/] [#fff]{additional}[/]"
        columnSeries.columns.template.propertyFields.fillOpacity = "fillOpacity";
        columnSeries.columns.template.propertyFields.stroke = "stroke";
        columnSeries.columns.template.propertyFields.strokeWidth = "strokeWidth";
        columnSeries.columns.template.propertyFields.strokeDasharray = "columnDash";
        columnSeries.tooltip.label.textAlign = "middle";

        let lineSeries = chart.series.push(new am4charts.LineSeries());
        lineSeries.name = "Work Hours";
        lineSeries.dataFields.valueY = "w_q";
        lineSeries.dataFields.categoryX = "sec";

        lineSeries.stroke = am4core.color("#fdd400");
        lineSeries.strokeWidth = 3;
        lineSeries.propertyFields.strokeDasharray = "lineDash";
        lineSeries.tooltip.label.textAlign = "middle";

        let bullet = lineSeries.bullets.push(new am4charts.Bullet());
        bullet.fill = am4core.color("#fdd400"); // tooltips grab fill from parent by default
        bullet.tooltipText = "[#fff font-size: 15px]{name} in {categoryX}:\n[/][#fff font-size: 20px]{valueY}[/] [#fff]{additional}[/]"
        let circle = bullet.createChild(am4core.Circle);
        circle.radius = 4;
        circle.fill = am4core.color("#fff");
        circle.strokeWidth = 3;


        console.log(data, chart,'\n',categoryAxis,'\n' ,valueAxis,'\n', columnSeries,'\n', lineSeries);
      },

      searchData () {
        // console.log(search(this.search, this.employData));
        let con = new RegExp(this.search, 'i')
        let ans = this.totalDataset.filter((it) => {
          if (con.test(it.job_title) || con.test(it.country)) {
            console.log((con.test(it.job_title) || con.test(it.country)));
            return it
          }
        })
        this.employData = ans
        console.log('search result => ', ans);
        this.loading = false
      },
      getData() {
        let vm = this
        axios({
          url: '/api/users',
          method: 'get'
        }).then((res) => {
          vm.employData = res.data
          vm.totalDataset = res.data
          vm.loading = false
        })
      },
      generateRandomData () {
        let dataSet = []
        this.loading = true
        for (var i = 0; i < 100000; i++) {
          let set = {
            name: this.$faker().name.findName(),
            email: this.$faker().internet.email(),
            job_title: this.$faker().name.jobType(),
            country: this.$faker().address.country(),
            q1: this.$faker().datatype.number(20000),
            q2: this.$faker().datatype.number(20000),
            q3: this.$faker().datatype.number(20000),
            q4: this.$faker().datatype.number(20000),
            w_q1: this.$faker().datatype.number(400),
            w_q2: this.$faker().datatype.number(400),
            w_q3: this.$faker().datatype.number(400),
            w_q4: this.$faker().datatype.number(400),
          }
          set.total_salary = set.q1 + set.q2 + set.q3 + set.q4
          set.work_hr = set.w_q1 + set.w_q2 + set.w_q3 + set.w_q4
          set.id = i + 1
          dataSet.push(set)
        }
        let vm = this
        axios({
          url: '/api/createUser',
          method: 'post',
          data: dataSet
        }).then((res) => {
          vm.getData()
        })
      }
    }
  }
</script>

<style lang="scss" scoped>
  .search {
    margin-right: 10px;
    .search-input {
      border: none;
      border-bottom: 1px solid #ddd;
      font-size: 14px;
      width: 350px;
      padding-right: 75px;
      &::placeholder {
        font-size: 12px;
      }
      &:focus {
        outline: none;
        border-bottom-color: #1a76d2;
      }
    }
    .search-btn {
      margin-left: -75px;
    }
  }
  #chartdiv {
    height: 350px;
    width: 550px;
  }
</style>
